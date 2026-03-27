import random

from locust import HttpUser, between, task


class StorefrontUser(HttpUser):
    wait_time = between(0.05, 0.2)

    @task(1)
    def homepage(self):
        self.client.get("/")

    @task(14)
    def summary(self):
        with self.client.get("/api/summary", name="/api/summary", catch_response=True) as response:
            if response.status_code >= 400:
                response.failure(f"summary failed: {response.status_code}")
            else:
                response.success()

    @task(12)
    def checkout(self):
        with self.client.get("/api/checkout", name="/api/checkout", catch_response=True) as response:
            if response.status_code >= 400:
                response.failure(f"checkout failed: {response.status_code}")
            else:
                response.success()

    @task(18)
    def error_path(self):
        with self.client.get("/api/error", name="/api/error", catch_response=True) as response:
            if response.status_code >= 500:
                response.failure("intentional server error")
            else:
                response.success()

    @task(8)
    def unknown_path(self):
        with self.client.get(f"/api/does-not-exist-{random.randint(1, 1000)}", name="/api/not-found", catch_response=True) as response:
            if response.status_code >= 400:
                response.failure(f"not found: {response.status_code}")
            else:
                response.success()
