from typing import List
from crewai import Agent, Crew, Process, Task

def create_empire_elites_crew(manager_llm=None) -> Crew:
    agents_config = "../config/agents.yaml"
    tasks_config = "../config/tasks.yaml"

    import yaml
    from pathlib import Path

    base = Path(__file__).parent
    with open(base / agents_config) as f:
        agent_defs = yaml.safe_load(f)
    with open(base / tasks_config) as f:
        task_defs = yaml.safe_load(f)

    agents = []
    for key, cfg in agent_defs.items():
        agents.append(Agent(
            role=cfg["role"],
            goal=cfg["goal"],
            backstory=cfg["backstory"],
            verbose=True,
            allow_delegation=(key == "commander"),
        ))

    tasks = []
    for key, cfg in task_defs.items():
        agent = next(a for a in agents if a.role == agent_defs[cfg["agent"]]["role"])
        tasks.append(Task(
            description=cfg["description"],
            expected_output=cfg["expected_output"],
            agent=agent,
        ))

    return Crew(
        agents=agents,
        tasks=tasks,
        process=Process.hierarchical,
        manager_llm=manager_llm,
        verbose=True,
    )
