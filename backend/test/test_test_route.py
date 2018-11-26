import test_app

class TestRouteTest(test_app.AppTest):
    def test_route(self):
        response = self.client.get("/test")
        self.assertEquals(response.json, dict(success=True))