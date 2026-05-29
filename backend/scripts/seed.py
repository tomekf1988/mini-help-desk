"""Thin wrapper — delegates to app.seed which owns the seed logic."""
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

if __name__ == "__main__":
    import runpy
    runpy.run_module("app.seed", run_name="__main__")
