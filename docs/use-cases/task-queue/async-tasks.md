### Case Study: Asynchronous Task Processing

Asynchronous tasks are commonly used to move time-consuming or compute-intensive operations off the request path. This page uses a web form as an example and records the producer, consumer, and processing logic of a Redis task queue.

#### 1. Background

Take an online form as an example: the submitted data includes name, email, and message, and can be used to send a confirmation email or write to a database. To avoid making the request wait for these time-consuming operations, the application puts the form data into a task queue for a background process to handle.

#### 2. System Design

##### 2.1 Components

- **Task producer**: the web app, responsible for adding the user's submitted form data to the Redis task queue.
  
- **Task queue**: a Redis List data structure, used to store pending tasks.
  
- **Task consumer**: a background process, responsible for fetching tasks from the queue and processing them, for example sending an email or storing data.

##### 2.2 Flow

1. **User submits the form**: the user enters data into the web form and submits it.
2. **Form data is stored in the task queue**: the web app adds the form data to the Redis task queue.
3. **Background task processing**: the background process fetches the form data from the queue and performs the necessary processing (such as sending an email or storing data).

#### 3. Implementation

##### 3.1 Web App (Task Producer)

The web app is responsible for adding the user's submitted form data to the Redis queue. Below is an example using Python Flask:

```python
from flask import Flask, request, jsonify
import redis

app = Flask(__name__)
redis_client = redis.Redis(host='localhost', port=6379, db=0)

@app.route('/submit_form', methods=['POST'])
def submit_form():
    data = request.json
    user_name = data.get('name')
    email = data.get('email')
    message = data.get('message')

    # Create task data
    task_data = f"{user_name},{email},{message}"

    # Add the task data to the Redis queue
    redis_client.lpush('task_queue', task_data)

    return jsonify({"status": "success", "message": "Form submitted successfully!"})

if __name__ == '__main__':
    app.run(debug=True)
```

##### 3.2 Task Processor (Task Consumer)

The background process fetches tasks from the Redis queue and processes them. Below is a Python script example:

```python
import redis
import time
import smtplib
from email.mime.text import MIMEText

redis_client = redis.Redis(host='localhost', port=6379, db=0)

def send_email(to_email, subject, body):
    msg = MIMEText(body)
    msg['Subject'] = subject
    msg['From'] = 'no-reply@example.com'
    msg['To'] = to_email

    with smtplib.SMTP('localhost') as server:
        server.sendmail(msg['From'], [msg['To']], msg.as_string())

def process_task(task):
    user_name, email, message = task.split(',', 2)
    subject = 'Thank you for your submission!'
    body = f"Hello {user_name},\n\nThank you for your message:\n{message}\n\nBest regards,\nYour Company"

    # Send a confirmation email
    send_email(email, subject, body)

while True:
    task = redis_client.brpop('task_queue')
    if task:
        _, task_data = task
        process_task(task_data.decode())
    time.sleep(1)
```

##### 3.3 Monitoring and Management

In a real production environment, you may need to add monitoring to track the status and performance of task processing. You can use Redis's Key-Value data structure to record task status, or use existing monitoring tools to monitor Redis performance and health.

#### 4. Summary

By using Redis to implement asynchronous task processing, you can separate time-consuming operations from user requests, avoiding blocking user requests and improving the system's response speed. The task producer adds task data to the Redis queue, and the task consumer fetches and processes tasks from the queue. Using Redis's List data structure and blocking operations (`BRPOP`) lets you manage the task queue effectively and achieve efficient asynchronous processing.

## References

- [Redis Developer Docs · Use Cases](https://redis.io/docs/latest/develop/use-cases/)
- [Redis Developer Docs · Lists](https://redis.io/docs/latest/develop/data-types/lists/)

<!-- BACKLINKS-AUTO -->
## Related pages

- [README](/use-cases/README.md)
- &#8203;task-queue<!-- EN-LINK: /use-cases/task-queue.md -->
- &#8203;design<!-- EN-LINK: design.md -->
