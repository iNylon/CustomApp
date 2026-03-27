import random

from locust import HttpUser, between, task


class StorefrontUser(HttpUser):
    wait_time = between(0.05, 0.2)

    @task(1)
    def homepage(self):
        self.client.get("/")

    @task(14)
    def summary(self):
        self.client.get("/api/summary", name="/api/summary")

    @task(12)
    def checkout(self):
        self.client.get("/api/checkout", name="/api/checkout")

    @task(1)
    def error_path(self):
        if random.randint(1, 100) <= 35:
            self.client.get("/api/error", name="/api/error")
