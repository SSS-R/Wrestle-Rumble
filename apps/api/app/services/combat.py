import random

def calculate_battle_score(user_card: dict, opponent_card: dict) -> tuple[int, int]:
    user_score = (user_card['att'] * 0.7 + user_card['defense'] * 0.3) * random.uniform(0.85, 1.15)
    opponent_score = (opponent_card['att'] * 0.7 + opponent_card['defense'] * 0.3) * random.uniform(0.85, 1.15)
    return int(user_score), int(opponent_score)

def calculate_rewards(user_won: bool, user_level: int, opponent_trophies: int = None) -> tuple[int, int]:
    if user_won:
        base_trophies = 15
        base_coins = 100
        if opponent_trophies and opponent_trophies > user_level * 5: # level scaled roughly with age
            base_trophies += 5
            base_coins += 50
        return base_trophies, base_coins
    else:
        return 0, 25