import uuid


class NotFoundError(Exception):
    def __init__(self, resource_id: uuid.UUID) -> None:
        self.resource_id = resource_id
        super().__init__(f"Resource {resource_id} not found")
