"""Root entrypoint placeholder.

The deployable Python service is the RAPIDS substrate at
`artifacts/rapids-substrate` (FastAPI, served via uvicorn). This root module
exists only to satisfy the Replit nix Python module; it is NOT a service.

Run the substrate with:
    cd artifacts/rapids-substrate && uvicorn main:app --host 0.0.0.0 --port 8000
"""


def main() -> None:
    print(
        "PATHFINDER root: no service here. "
        "Run the RAPIDS substrate from artifacts/rapids-substrate."
    )


if __name__ == "__main__":
    main()
