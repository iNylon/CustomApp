import random

from locust import HttpUser, between, task


class StorefrontUser(HttpUser):
    wait_time = between(0.5, 2.0)

    @task(5)
    def homepage(self):
        self.client.get("/")

    @task(8)
    def summary(self):
        self.client.get("/api/summary", name="/api/summary")

    @task(6)
    def checkout(self):
        self.client.get("/api/checkout", name="/api/checkout")

    @task(2)
    def error_path(self):
        if random.randint(1, 100) <= 35:
            self.client.get("/api/error", name="/api/error")
