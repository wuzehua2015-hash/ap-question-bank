import json

with open('public/data/ap/microeconomics/2012_question_bank.json', 'r', encoding='utf-8') as f:
    questions = json.load(f)

q_map = {q['question_number']: q for q in questions}

# Fix texts that have table headers mixed in
fixes = {
    3: "Assume that consumers consider popcorn and pretzels to be substitutes. A significant decrease in the supply of popcorn will affect the pretzel market by",
    5: "If a 5 percent wage increase in a particular labor market results in a 10 percent decrease in employment, the demand for labor in that market is",
    6: "If the average total cost of producing 5 units of a good is $10 and the average total cost of producing 6 units of the same good is $13, then the marginal cost of the 6th unit is",
    8: "If a firm is maximizing its economic profits and the marginal product of the last unit of labor hired is 10 units per day, the wage rate is $100 per day, and the firm's output sells for $20 per unit, at what output level is the firm producing?",
    13: "Businesses employ workers from city neighborhoods and rural areas. These workers are perfect substitutes and cannot relocate in the short run. The government offers businesses a wage subsidy if they hire workers from city neighborhoods. What is the effect of the subsidy on the wage rate of rural workers and on the total hours they work?",
    14: "A per-unit tax on pollution produced by a firm will affect the firm's output and pollution levels in which of the following ways?",
    17: "Following a prolonged power outage, the price of flashlights normally increases significantly. If city officials systematically impose a price ceiling on flashlights during such emergencies, in the long run the number of flashlights available is likely to",
    18: "What is the price paid by consumers and the net price received by producers after the tax is paid?",
    22: "The graph above shows the long-run average total cost curve for a firm. In the long run, if the firm increases its output from Q1 to Q2, its average total cost",
    23: "A constant-cost, perfectly competitive gadget industry is in long-run equilibrium. An increase in the number of consumers of gadgets will most likely result in",
    24: "The profit-maximizing firm depicted in the graph above should",
    25: "If the average variable cost of producing 5 units of a good is $100 and the average variable cost of producing 6 units of the same good is $100, the marginal cost of increasing output from 5 to 6 units is",
    27: "The marginal physical product of the second worker is",
    28: "If a firm's total revenue is $150,000 and its explicit costs are $50,000, its accounting profit is",
    29: "The government can increase allocative efficiency by",
    34: "Promoters of a rock group know that if they charged $8 a ticket, 400 people would buy tickets for a concert. If they charged $7 a ticket instead, 500 people would buy tickets. Over this price range, the demand for concert tickets for the rock group is",
    35: "If the price of onions increases, the demand for onions will most likely",
    42: "The graph above shows the short-run cost curves of a firm in a perfectly competitive market. Which of the following are true at the firm's profit-maximizing output level?",
    44: "Most economists argue that a monopoly is inefficient because it",
    46: "The opportunity cost of attending the community college is",
    48: "Suppose that the market supply curve for shoes is upward sloping and the market demand curve is downward sloping. How will the imposition of a sales tax on shoes affect the consumer surplus, the producer surplus, and the total surplus?",
    49: "A consumer is willing to pay $2,000 for a diamond ring but is able to purchase the ring for $1,500. The consumer's willingness to pay $2,000 for a diamond ring indicates that the",
    52: "The graph above shows the total revenue and total cost curves for a firm in which type of market structure and what is the profit-maximizing quantity?",
    53: "For a monopoly, the marginal revenue curve is always below the demand curve because",
    55: "In a perfectly competitive free market economy, a wage gap between two workers can be explained by differences in all of the following EXCEPT their",
    56: "Firm XYZ produces and sells corn in a perfectly competitive market and hires its workers in a perfectly competitive labor market. Which of the following best describes the demand curve for XYZ's corn and XYZ's demand curve for labor?",
    57: "A perfectly competitive firm advertises in order to",
    58: "A profit-maximizing firm will hire an input up to the point at which",
    59: "Which of the following statements correctly describes the relationship between the marginal social benefit and marginal social cost of providing the quantity of a public good at the socially optimal quantity?",
    60: "Given the information about the firm's long-run average total cost curve, one can conclude that the",
}

for qn, correct_text in fixes.items():
    q_map[qn]['text'] = correct_text

with open('public/data/ap/microeconomics/2012_question_bank.json', 'w', encoding='utf-8') as f:
    json.dump(questions, f, indent=2, ensure_ascii=False)

print(f'Fixed {len(fixes)} question texts')
