
from typing import List, Dict
import random
from datetime import datetime, timedelta
from agents.market_agents import AgentOpinion, NewsAgent, FundamentalAgent, CompetitorAgent
# from models import ChartData # Assuming you have this model

class AgentManager:
    def __init__(self):
        self.agents = [
            NewsAgent(),
            FundamentalAgent(),
            CompetitorAgent(),
            # Add more agents here
        ]
        
    def analyze_symbol(self, symbol: str) -> Dict:
        """모든 에이전트의 분석 결과를 종합"""
        opinions = []
        total_score = 0
        
        for agent in self.agents:
            op = agent.analyze(symbol)
            opinions.append({
                "name": op.name,
                "score": op.score,
                "reason": op.reason,
                "details": op.details,
                "recommendation": op.recommendation
            })
            total_score += op.score
            
        # 종합 의견 도출 (Weighted Average)
        avg_score = total_score / len(self.agents)
        
        final_decision = "보유"
        if avg_score > 3: final_decision = "매수"
        if avg_score > 7: final_decision = "강력 매수"
        if avg_score < -3: final_decision = "매도"
        if avg_score < -7: final_decision = "강력 매도"
        
        summary = f"에이전트 {len(self.agents)}명의 종합 의견은 '{final_decision}'입니다. (평균 점수: {avg_score:.1f}/10)"
        
        return {
            "symbol": symbol,
            "opinions": opinions,
            "final_decision": final_decision,
            "avg_score": avg_score,
            "summary": summary
        }

# Singleton instance
agent_manager = AgentManager()
