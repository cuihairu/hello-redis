### Case study: real-time data dashboard

This article starts from the dashboard use case; for the Streams and ZSET data processing details, see [Real-time data processing](data-processing.md).

#### Overview

A real-time data dashboard displays metrics for business operations, system monitoring, financial markets, the Internet of Things, and similar scenarios. Charts and metrics make system state and key changes more intuitive, supporting real-time decision making.

Redis can serve as the backend data store and processing engine for a real-time data dashboard, providing high-performance data read/write and real-time update capabilities.

#### Designing a real-time data dashboard

1. **Data source**: The data sources for a real-time data dashboard can be sensors, log systems, user behavior data, and so on. Redis is used to collect, store, and process this data in real time.

2. **Data storage**: Redis data structures (such as Streams, Sorted Sets, and Lists) are used to store and process the real-time data. Streams handle data streams, Sorted Sets handle sorting and ranking, and Lists are used for log storage, among other things.

3. **Data visualization**: The frontend uses a charting library (such as D3.js or Chart.js) to display the data. The frontend application fetches real-time data from Redis and renders the visualization through the charting library.

4. **Data updates**: The dashboard needs to update data in real time. Redis's Pub/Sub feature can be used to push data change notifications in real time, and the frontend fetches the updated data via WebSocket or polling.

#### Implementation steps

##### 1. Set up Redis

First, make sure Redis is properly installed and configured so it can provide data support for the dashboard.

```bash
# Start the Redis server
redis-server
```

##### 2. Data collection and storage

In a real application, data may come from different sensors or services. The following example shows how to add real-time data to Redis Streams.

```python
import redis
import json
import time

# Connect to Redis
redis_client = redis.Redis(host='localhost', port=6379, db=0, decode_responses=True)

def add_sensor_data(sensor_id, value):
    timestamp = int(time.time() * 1000)  # Millisecond timestamp of the current time
    data = {'sensor_id': sensor_id, 'value': value, 'timestamp': timestamp}
    redis_client.xadd('sensor_data', data, id='*')

# Example: add sensor data
while True:
    add_sensor_data('sensor1', 23.4)
    time.sleep(1)  # Add data once per second
```

##### 3. Frontend data display

The frontend application reads real-time data from Redis and displays it on the dashboard. The following is a simple example showing how to build a real-time data dashboard using Python and Flask.

```python
from flask import Flask, render_template, jsonify
import redis

app = Flask(__name__)
redis_client = redis.Redis(host='localhost', port=6379, db=0)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/data')
def data():
    # Read the latest data from Redis Streams
    data = redis_client.xrevrange('sensor_data', count=10)  # Get the latest 10 records
    return jsonify([{'sensor_id': d[1][b'sensor_id'].decode(), 'value': float(d[1][b'value'].decode()), 'timestamp': int(d[1][b'timestamp'].decode())} for d in data])

if __name__ == '__main__':
    app.run(debug=True)
```

##### 4. Real-time data updates

Use JavaScript to periodically fetch the latest data from the server on the frontend and update the dashboard. For example, you can use Ajax polling or WebSocket to get real-time data.

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Real-time data dashboard</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>
<body>
    <canvas id="sensorChart" width="400" height="200"></canvas>
    <script>
        const ctx = document.getElementById('sensorChart').getContext('2d');
        const chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Sensor value',
                    data: [],
                    borderColor: 'rgb(75, 192, 192)',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)'
                }]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });

        function fetchSensorData() {
            fetch('/data')
                .then(response => response.json())
                .then(data => {
                    // The API returns records with the newest first; reverse them to display in chronological order
                    const series = data.slice().reverse();
                    chart.data.labels = series.map(d => new Date(d.timestamp).toLocaleTimeString());
                    chart.data.datasets[0].data = series.map(d => d.value);
                    chart.update();
                });
        }

        // Refresh every 2 seconds
        fetchSensorData();
        setInterval(fetchSensorData, 2000);
    </script>
</body>
</html>
```

##### 5. Project summary

1. **Data stream processing**: Redis Streams are very well suited to processing real-time data streams. You can write sensor data or log data to a stream and display it on the dashboard.
2. **Real-time updates**: Real-time data updates are achieved through WebSocket or Ajax polling, ensuring the frontend dashboard shows the latest data.
3. **Visualization**: Charting libraries such as Chart.js are used to visualize real-time data, providing an intuitive user interface.

#### Case study summary

This example writes real-time monitoring and analysis data into Redis, then displays and interacts with it on the frontend; data storage, processing approach, and refresh frequency all influence the dashboard experience together.

## References

- [Redis development docs · Use cases](https://redis.io/docs/latest/develop/use-cases/)
- [Redis development docs · Probabilistic](https://redis.io/docs/latest/develop/data-types/probabilistic/)

<!-- BACKLINKS-AUTO -->
## Related pages

- [README](/use-cases/README.md)
- [real-time-analysis](/use-cases/real-time-analysis.md)
