import random

MOVE_TYPES = [
    ("grapple", "Grapple exchange"),
    ("strike", "Strike combo"),
    ("taunt", "Taunt"),
    ("signature", "Signature move"),
    ("finisher", "Finisher attempt"),
    ("counter", "Counter attack"),
    ("comeback", "Comeback moment"),
]

EFFECTS = [
    "stun", "boost", "weak", "critical", "dodge", "block", "momentum"
]

def generate_battle_events(user_card: dict, opponent_card: dict, duration: int = 15) -> list:
    events = []
    num_events = random.randint(8, 12)
    time_step = duration / num_events
    
    user_name = user_card.get('name', 'User')
    opp_name = opponent_card.get('name', 'Opponent')
    
    user_momentum = 50
    opp_momentum = 50
    
    for i in range(num_events):
        timestamp = round(i * time_step, 1)
        move_type, move_desc = random.choice(MOVE_TYPES)
        
        is_user_turn = random.random() > 0.5
        actor = user_name if is_user_turn else opp_name
        target = opp_name if is_user_turn else user_name
        actor_stats = user_card if is_user_turn else opponent_card
        
        damage = 0
        effect = None
        
        if move_type == "grapple":
            damage = random.randint(5, 15)
            effect = random.choice(["block", None])
            desc = f"{actor} locks up with {target} - {move_desc}"
        elif move_type == "strike":
            damage = random.randint(8, 20)
            effect = "critical" if random.random() > 0.8 else None
            desc = f"{actor} hits {target} with {move_desc}"
        elif move_type == "taunt":
            momentum_gain = 10
            if is_user_turn:
                user_momentum = min(100, user_momentum + momentum_gain)
            else:
                opp_momentum = min(100, opp_momentum + momentum_gain)
            desc = f"{actor} taunts the crowd - momentum building"
        elif move_type == "signature":
            damage = random.randint(15, 30)
            effect = "stun" if random.random() > 0.7 else None
            desc = f"{actor} hits SIGNATURE: {user_card.get('signature', 'special move')}!"
        elif move_type == "finisher":
            damage = random.randint(25, 50)
            effect = "critical" if random.random() > 0.5 else "dodge"
            desc = f"{actor} goes for FINISHER: {user_card.get('finisher', 'finishing move')}!"
        elif move_type == "counter":
            damage = random.randint(10, 25)
            effect = "dodge"
            desc = f"{actor} counters {target}'s move!"
        elif move_type == "comeback":
            damage = random.randint(20, 35)
            effect = "boost"
            desc = f"{actor} makes a dramatic comeback!"
        else:
            desc = f"{actor} and {target} exchange blows"
        
        if is_user_turn:
            opp_momentum = max(0, opp_momentum - (damage / 2))
        else:
            user_momentum = max(0, user_momentum - (damage / 2))
        
        events.append({
            "timestamp": timestamp,
            "event_type": move_type,
            "actor": actor,
            "description": desc,
            "damage": damage if damage > 0 else None,
            "effect": effect
        })
    
    user_won = user_score > opponent_score
    
    events.append({
        "timestamp": float(duration),
        "event_type": "conclusion",
        "actor": "referee",
        "description": f"{user_name if user_won else opp_name} WINS!",
        "damage": None,
        "effect": None
    })
    
    return events

def calculate_battle_score(user_card: dict, opponent_card: dict, events: list = None) -> tuple[int, int]:
    base_user = (user_card['att'] * 0.7 + user_card['defense'] * 0.3)
    base_opp = (opponent_card['att'] * 0.7 + opponent_card['defense'] * 0.3)
    
    user_score = base_user * random.uniform(0.85, 1.15)
    opponent_score = base_opp * random.uniform(0.85, 1.15)
    
    return int(user_score), int(opponent_score)

def calculate_rewards(user_won: bool, user_level: int, opponent_trophies: int = None, ranked: bool = False) -> tuple[int, int]:
    if user_won:
        base_trophies = 25 if ranked else 15
        base_coins = 200 if ranked else 100
        if opponent_trophies and opponent_trophies > user_level * 5:
            base_trophies += 5 if ranked else 3
            base_coins += 50 if ranked else 25
        return base_trophies, base_coins
    else:
        return 0, 50 if ranked else 25