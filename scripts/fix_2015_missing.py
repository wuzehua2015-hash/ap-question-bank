import json

with open('public/data/ap/microeconomics/2015_raw_extraction.json', 'r', encoding='utf-8') as f:
    questions = json.load(f)

# Q6: missing - text with subscripts
q6 = {
    'question_number': 6,
    'text': "Let U_s be the marginal utility of a sandwich, MU_h be the marginal utility of a hot dog, P_s be the price of a sandwich, and P_h be the price of a hot dog. When the price of the goods is zero, Pat eats a sandwich. When Pat has to pay, she eats a hot dog. When Pat has to pay for both, she chooses the combination of sandwiches and hot dogs that maximizes her utility. Which of the following best explains Pat's choices?",
    'options': {
        'A': 'A sandwich is a normal good, and a hot dog is an inferior good.',
        'B': 'A sandwich is an inferior good, and a hot dog is a normal good.',
        'C': 'The marginal utility per dollar spent on sandwiches is greater than the marginal utility per dollar spent on hot dogs.',
        'D': 'The marginal utility per dollar spent on hot dogs is greater than the marginal utility per dollar spent on sandwiches.',
        'E': 'The marginal utility of sandwiches is greater than the marginal utility of hot dogs.'
    }
}

# Q15: missing - page start issue
q15 = {
    'question_number': 15,
    'text': 'National defense is an example of a public good because',
    'options': {
        'A': 'it requires tax revenues to fund any production',
        'B': "one person's use of it will decrease another person's ability to use it",
        'C': 'it is nonexcludable and nonrival',
        'D': 'the private market typically produces the socially efficient quantity',
        'E': 'it is both excludable and rival'
    }
}

# Q38: missing - graph question
q38 = {
    'question_number': 38,
    'text': 'In the graph below, TC is total cost and TR is total revenue. At which level of output does the firm maximize profit?',
    'options': {'A': 'See graph', 'B': 'See graph', 'C': 'See graph', 'D': 'See graph', 'E': 'See graph'},
    'requires_graph': True,
    'diagram_references': ['tc_tr_curves']
}

# Q60: missing - table options
q60 = {
    'question_number': 60,
    'text': 'In the monopsonistic labor market shown in the diagram above, which of the following indicates the number of workers the firm will hire and the wage rate it will pay?',
    'options': {
        'A': 'L1 / W1',
        'B': 'L1 / W2',
        'C': 'L1 / W3',
        'D': 'L2 / W2',
        'E': 'L2 / W3'
    },
    'option_table_data': {
        'headers': ['Number of Workers', 'Wage Rate'],
        'rows': {
            'A': ['L1', 'W1'],
            'B': ['L1', 'W2'],
            'C': ['L1', 'W3'],
            'D': ['L2', 'W2'],
            'E': ['L2', 'W3']
        }
    },
    'requires_graph': True,
    'diagram_references': ['monopsony_labor_market']
}

questions.append(q6)
questions.append(q15)
questions.append(q38)
questions.append(q60)
questions.sort(key=lambda x: x['question_number'])

with open('public/data/ap/microeconomics/2015_raw_extraction.json', 'w', encoding='utf-8') as f:
    json.dump(questions, f, indent=2, ensure_ascii=False)

print(f'Fixed: {len(questions)} questions, numbers: {[q[\"question_number\"] for q in questions]}')
