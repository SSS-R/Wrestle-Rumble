import random
from ..models import Card, Rarity


def get_daily_pack_cards(weights: dict) -> list[Rarity]:
    rarities = []
    roll = random.random()
    if roll < weights.get('legendary', 0):
        rarities.append(Rarity.LEGENDARY)
    elif roll < weights.get('legendary', 0) + weights.get('epic', 0):
        rarities.append(Rarity.EPIC)
    elif roll < weights.get('legendary', 0) + weights.get('epic', 0) + weights.get('rare', 0):
        rarities.append(Rarity.RARE)
    else:
        rarities.append(Rarity.COMMON)
    return rarities


def calculate_battle_score(user_card: Card, opponent_card: Card) -> tuple[int, int]:
    user_score = (user_card.attack * 0.7 + user_card.defense * 0.3) * random.uniform(0.85, 1.15)
    opponent_score = (opponent_card.attack * 0.7 + opponent_card.defense * 0.3) * random.uniform(0.85, 1.15)
    return int(user_score), int(opponent_score)


def calculate_rewards(user_won: bool, user_level: int, opponent_trophies: int = None) -> tuple[int, int]:
    if user_won:
        base_trophies = 15
        base_coins = 100
        if opponent_trophies and opponent_trophies > user_level * 50:
            base_trophies += 5
            base_coins += 50
        return base_trophies, base_coins
    else:
        return 0, 25