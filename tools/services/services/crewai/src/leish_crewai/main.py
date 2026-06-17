import json
import sys
import os
import re

from crewai import LLM

def run_empire_elites(mission: str) -> dict:
    from leish_crewai.crews.empire_elites import create_empire_elites_crew

    api_key = os.environ.get("AI_GATEWAY_API_KEY") or os.environ.get("OPENAI_API_KEY")
    base_url = os.environ.get("CREWAI_BASE_URL")
    model = os.environ.get("CREWAI_MODEL", "openai/gpt-4o")

    if api_key:
        os.environ["OPENAI_API_KEY"] = api_key
        if base_url:
            manager_llm = LLM(model=model, api_key=api_key, base_url=base_url)
        else:
            manager_llm = LLM(model=model, api_key=api_key)
    else:
        manager_llm = LLM(model=model)

    crew = create_empire_elites_crew(manager_llm=manager_llm)
    result = crew.kickoff(inputs={"mission": mission})

    output = result.raw or ""
    requires_financial_review = bool(re.search(r"\[FINANCIAL_REVIEW_REQUIRED\]", output))
    return {"output": output, "requires_financial_review": requires_financial_review}

CREW_ROUTER = {"empire_elites": run_empire_elites}

def cli():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Usage: leish-crew <crew_name>"}), file=sys.stderr)
        sys.exit(1)
    crew_name = sys.argv[1]
    input_data = json.loads(sys.stdin.read()) if not sys.stdin.isatty() else {}
    handler = CREW_ROUTER.get(crew_name)
    if not handler:
        print(json.dumps({"error": f"Unknown crew: {crew_name}"}), file=sys.stderr)
        sys.exit(1)
    result = handler(**input_data)
    print(json.dumps(result))

if __name__ == "__main__":
    cli()
