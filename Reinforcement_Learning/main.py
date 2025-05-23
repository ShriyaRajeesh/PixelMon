from flask import Flask, request, jsonify
import random
import time
import json
import numpy as np
from flask_cors import CORS

app = Flask(__name__)

# Allow CORS for all domains
CORS(app, resources={r"/*": {"origins": "*"}})  # <=== FIXED

MOVES = [
    {"id": 17, "name": "Rock Slide", "animationName": "ROCK_SLIDE", "type": "ROCK"},
    {"id": 18, "name": "Thunderbolt", "animationName": "THUNDERBOLT", "type": "ELECTRIC"},
    {"id": 19, "name": "Flamethrower", "animationName": "FLAMETHROWER", "type": "FIRE"},
]

# Load the trained Q-table
q_table = np.load("q_table_agent.npy")

def discretize_state(state):
    """
    State vector:
    [agent_active_hp, opponent_active_hp, last_agent_damage, last_opponent_damage, agent_remaining]

    We use predefined bins for HP and damage; agent_remaining is an integer (1 to 4).
    """
    # Define bins for HP and damage
    hp_bins = np.array([0, 100, 200, 300, 400, 500])
    damage_bins = np.array([0, 20, 40, 60, 80, 100])

    # Discretize agent active HP: cap maximum index at len(hp_bins)-3 so the max index is 3.
    hp1_idx = np.digitize(state[0], hp_bins) - 1
    hp1_idx = min(hp1_idx, len(hp_bins) - 3)

    # Discretize opponent active HP
    hp2_idx = np.digitize(state[1], hp_bins) - 1
    hp2_idx = min(hp2_idx, len(hp_bins) - 3)

    # Discretize last agent damage
    dmg1_idx = np.digitize(state[2], damage_bins) - 1
    dmg1_idx = min(dmg1_idx, len(damage_bins) - 3)

    # Discretize last opponent damage
    dmg2_idx = np.digitize(state[3], damage_bins) - 1
    dmg2_idx = min(dmg2_idx, len(damage_bins) - 3)

    # Agent remaining: values from 1 to 4 → subtract 1 to get an index from 0 to 3.
    remain_idx = int(state[4]) - 1
    remain_idx = min(max(remain_idx, 0), 3)

    return (hp1_idx, hp2_idx, dmg1_idx, dmg2_idx, remain_idx)

def getState(team1, team2):
    """
    Convert team data from frontend to state vector for RL model.
    
    Expected team format:
    {
        "activePokemonIndex": 0,
        "pokemon": [
            {
                "name": "Pikachu",
                "hp": 100,
                "maxHp": 100,
                "type": "Electric",
                "moves": [...],
                "lastDamageDealt": 20
            },
            ...
        ],
        "lastDamageReceived": 15
    }
    
    Returns:
    [agent_active_hp, opponent_active_hp, last_agent_damage, last_opponent_damage, agent_remaining]
    """
    # Get AI agent's (team2) active Pokemon
    agent_active_idx = team2.get("activePokemonIndex", 0)
    agent_active_hp = team2["pokemon"][agent_active_idx]["hp"]
    
    # Get opponent's (team1) active Pokemon
    opponent_active_idx = team1.get("activePokemonIndex", 0)
    opponent_active_hp = team1["pokemon"][opponent_active_idx]["hp"]
    
    # Get last damage values
    last_agent_damage = team2.get("lastDamageDealt", 0)
    last_opponent_damage = team1.get("lastDamageDealt", 0)
    
    # Count remaining Pokemon for the agent (hp > 0)
    agent_remaining = sum(1 for p in team2["pokemon"] if p["hp"] > 0)
    
    return np.array([
        agent_active_hp,
        opponent_active_hp,
        last_agent_damage,
        last_opponent_damage,
        agent_remaining
    ], dtype=np.float32)

def translateAction(action, team):
    """
    Translate the RL model action (0-7) to a response for the frontend.
    Actions 0-3: Use a move
    Actions 4-7: Switch Pokemon
    """
    active_idx = team.get("activePokemonIndex", 0)
    active_pokemon = team["pokemon"][active_idx]
    
    if action < 4:  # Use a move
        # Ensure we have enough moves
        if len(active_pokemon.get("moves", [])) <= action:
            # Fallback to first move if the selected move index is invalid
            action = 0
            
        move_info = active_pokemon["moves"][action]
        return {
            "type": "move",
            "moveIndex": action,
            "moveName": move_info.get("name", f"Move {action+1}")
        }
    else:  # Switch Pokemon
        switch_idx = action - 4
        # Check if the Pokemon to switch to is alive
        if switch_idx < len(team["pokemon"]) and team["pokemon"][switch_idx]["hp"] > 0:
            return {
                "type": "switch",
                "pokemonIndex": switch_idx,
                "pokemonName": team["pokemon"][switch_idx]["name"]
            }
        else:
            # Fallback: use a move if the switch is invalid
            return {
                "type": "move",
                "moveIndex": 0,
                "moveName": active_pokemon["moves"][0].get("name", "Move 1")
            }

def format_team_data(team, damage_dealt, move_data, active_pokemon_index=0):
    formatted_team = {
        "activePokemonIndex": active_pokemon_index,
        "pokemon": [],
        "lastDamageReceived": damage_dealt[0] if damage_dealt else 0  # First value represents damage taken
    }

    # Convert move_data into a dictionary for quick lookup
    move_dict = {move["id"]: move for move in move_data}

    for i, pkmn in enumerate(team):
        # Extract moves for this Pokémon
        moves = []
        for move_id in pkmn.get("attackIds", []):
            if move_id in move_dict:
                moves.append({
                    "name": move_dict[move_id]["name"],
                    "damage": 10,
                    "type": move_dict[move_id]["type"]
                })

        formatted_team["pokemon"].append({
            "name": pkmn["name"].capitalize(),  # Capitalized name
            "hp": pkmn["currentHp"],  # Actual current HP
            "maxHp": pkmn["maxHp"],  # Actual max HP
            "type": pkmn["type"].capitalize(),  # Capitalized type
            "moves": moves,  # Assigned moves
            "lastDamageDealt": damage_dealt[i] if i < len(damage_dealt) else 0
        })

    return formatted_team






@app.route('/fetchOpponentMove', methods=['POST'])
def fetchOppMove():
    try:
        data = request.get_json()  # Extract JSON from request body
        if not data:
            return jsonify({"error": "Invalid JSON data"}), 400

        team1 = data.get("team1", [])
        team2 = data.get("team2", [])
        move_data = data.get("MoveData", [])
        player_damage = data.get("PlayerDamage", [])
        opponent_damage = data.get("OpponentDamage", [])
        formatted_team1 = format_team_data(team1, player_damage, move_data)
        formatted_team2 = format_team_data(team2, opponent_damage,move_data)
        print(json.dumps(formatted_team1, indent=4))
        print(json.dumps(formatted_team2, indent=4)) 
        print()
        # print("opponent",formatted_team2)
        print()

    

        # move = random.choice(MOVES)

        # return jsonify({"move": move})
        # Convert team data to state
        state = getState(formatted_team1, formatted_team2)
        
        print("STATE IS HERE: ")
        print(state)

        # Get action from Q-table
        state_idx = discretize_state(state)
        action = int(np.argmax(q_table[state_idx]))
        

        # Translate action to a response for the frontend
        response_data = translateAction(action, formatted_team2)
        
        # Add the raw action for debugging
        response_data["rcawAction"] = int(action)
        
        print("SERVER SAYS THIS")
        print(action)
        print("RESPOINSE UWUW")
        print(response_data)

        return jsonify(response_data)

    except Exception as e:
        print("Server Error:", str(e))
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)