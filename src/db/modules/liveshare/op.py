def apply_op(content: str, op: dict) -> str:
    if op["type"] == "insert":
        return content[:op["pos"]] + op["text"] + content[op["pos"]:]
    
    if op["type"] == "delete":
        return content[:op["pos"]] + content[op["pos"] + op["length"]:]
    
    return content