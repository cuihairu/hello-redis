# Memory allocation and freeing

## Overview

Redis does not call `malloc`/`free` directly; instead, src/zmalloc.c wraps them in a family of `z*` interfaces. This layer does three things: it abstracts the allocator into a replaceable implementation (jemalloc/libc/tcmalloc), records the real size of every allocation to back the `INFO memory` accounting, and provides byte-precise frees and diagnostics. Understanding this code is the starting point for every Redis memory question.

## The zmalloc family and allocator swapping

Core interfaces provided by src/zmalloc.c:

- `zmalloc()` / `ztrymalloc()`: allocate memory; the latter returns NULL on failure instead of aborting;
- `zcalloc()`, `zrealloc()`, `ztryrealloc()`: zeroed allocation and growth;
- `zfree()`, `zfree_usable()`: free; the latter also returns the size that was freed;
- `zstrdup()`: duplicate a string;
- `zmalloc_size()`: return the real usable size of a block (based on `malloc_usable_size`);
- `zmalloc_used_memory()`: return the globally accumulated allocated byte count — that is, `used_memory` in `INFO memory`.

The allocator is chosen at compile time, controlled by the `MALLOC` variable in src/Makefile: jemalloc is the Linux default, and libc or tcmalloc can be selected instead. With jemalloc, for instance, zmalloc.c performs a direct symbol replacement:

```c
#if defined(USE_JEMALLOC)
#define malloc(size) je_malloc(size)
...
#endif
```

So every `malloc` call in the source lands in jemalloc at link time. You can verify this with `redis-server -v`:

```bash
$ redis-server -v
Redis server v=8.0.5 sha=00000000:0 malloc=jemalloc-5.3.0 bits=64 build=9729964261b8fc0f
$ redis-cli -p 6399 info memory | grep mem_allocator
mem_allocator:jemalloc-5.3.0
```

## Accounting: zmalloc_size and usable size

`used_memory` is exact because zmalloc.c records the size of every allocation:

- On platforms that support `malloc_usable_size` (Linux/glibc and jemalloc both do), Redis uses `zmalloc_size(ptr)` to get the real capacity the allocator returned, with no extra prefix needed;
- accounting increments and decrements a global variable via `update_zmalloc_stat_alloc()` / `update_zmalloc_stat_free()`, and `zmalloc_used_memory()` simply reads that value.

This "borrow the allocator's usable size" design means Redis counts the bytes the allocator actually occupies, not the bytes requested — which is why `used_memory` lines up with jemalloc's `allocator_allocated`:

```bash
$ redis-cli -p 6399 info memory | grep -E 'allocator_allocated|allocator_active|allocator_resident'
allocator_allocated:2439744
allocator_active:2711552
allocator_resident:7372800
```

The gap between `allocator_active` and `allocator_allocated` comes from jemalloc's size class rounding and slab-structure overhead; `allocator_resident` is the pages the allocator has actually requested from the operating system.

## jemalloc size classes

jemalloc allocates in size classes (tiers such as 8, 16, 32, 48, 80 bytes); small objects get rounded up to the nearest tier. The direct impact on Redis: **once "many small" objects like hashes, zsets, and lists outgrow the listpack thresholds and switch to general-purpose structures, memory inflates noticeably from rounding**. It is one of the reasons Redis 7.0 swapped ziplist for listpack and keeps lowering the default thresholds.

The way to observe this is to store the same logical data under different encodings and compare with `memory usage`:

```bash
$ redis-cli -p 6399 hset bc:small a 1 b 2
(integer) 2
$ redis-cli -p 6399 object encoding bc:small
listpack
$ redis-cli -p 6399 memory usage bc:small
(integer) 88
```

## The free path: synchronous and lazy

An ordinary free goes through `zfree()`, completing in the calling thread. But when the object being freed may be large, Redis switches to lazy freeing so a single `free` cannot stall the main thread:

1. `UNLINK`, `FLUSHDB ASYNC`, `FLUSHALL ASYNC`, and deletes with the `lazyfree-lazy-*` configs enabled go into src/lazyfree.c;
2. Once triggered via `freeObjAsync()` or `emptyDbAsync()`, the job is submitted through `bioCreateLazyFreeJob()` in src/bio.c to the `BIO_LAZY_FREE` queue, where callbacks such as `lazyfreeFreeObject()` and `lazyfreeFreeDatabase()` run it;
3. the background thread finally calls `zfree()` to release the memory.

The `lazyfree_pending_objects` field in `INFO memory` shows how many objects are still waiting for background freeing (currently 0 on the instance in this example). In addition, Linux + jemalloc has a dedicated give-back mechanism: after forking a persistence child, the child calls `dismissMemoryInChild()` in src/server.c, which runs `madvise(MADV_DONTNEED)` via `zmadvise_dontneed()` in zmalloc.c on memory it no longer uses (such as copies of client buffers), returning physical pages to the operating system and easing copy-on-write memory amplification.

## Observing frees

```bash
$ redis-cli -p 6399 set bc:big $(python3 -c "print('x'*100000)")
OK
$ redis-cli -p 6399 memory usage bc:big
(integer) 114736
$ redis-cli -p 6399 unlink bc:big
(integer) 1
```

`UNLINK` returning 1 means the key has been detached from the keyspace; for short strings the free completes synchronously on the spot — only sufficiently large objects go to the background queue.

## Summary

Redis's memory allocation mechanics can be summed up as: **pick the allocator at compile time, account uniformly through zmalloc.c at runtime, let jemalloc's size classes absorb all the small objects, and let the lazyfree + bio threads digest large-object frees**. When reading the source, three functions are enough to build the framework: `zmalloc()` (allocate and account), `zmalloc_size()` (real footprint), `zfree()` (synchronous free); combined with the `allocator_*` fields of `INFO memory` and the `memory usage` command, you can map source behavior onto production metrics.

## References

- [Redis source repository](https://github.com/redis/redis)

## Related pages

- [optimization](optimization.md)

<!-- BACKLINKS-AUTO -->
## Related pages

- [optimization](optimization.md)
