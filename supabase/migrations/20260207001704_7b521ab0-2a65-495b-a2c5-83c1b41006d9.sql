
-- Fix increment_tool_usage to check BEFORE incrementing (prevents off-by-one bug)
CREATE OR REPLACE FUNCTION public.increment_tool_usage(
  p_user_id UUID,
  p_product_id UUID,
  p_tool_type TEXT,
  p_limit INTEGER
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_count INTEGER;
  v_usage_month DATE := date_trunc('month', CURRENT_DATE)::date;
  v_result JSON;
BEGIN
  -- First check current count
  SELECT usage_count INTO v_current_count
  FROM public.monthly_tool_usage
  WHERE user_id = p_user_id
    AND (product_id = p_product_id OR (product_id IS NULL AND p_product_id IS NULL))
    AND tool_type = p_tool_type
    AND usage_month = v_usage_month;

  IF v_current_count IS NULL THEN
    v_current_count := 0;
  END IF;

  -- If already at or above limit, return exceeded WITHOUT incrementing
  IF v_current_count >= p_limit THEN
    v_result := json_build_object(
      'count', v_current_count,
      'limit', p_limit,
      'exceeded', true
    );
    RETURN v_result;
  END IF;

  -- Otherwise increment
  INSERT INTO public.monthly_tool_usage (user_id, product_id, tool_type, usage_month, usage_count)
  VALUES (p_user_id, p_product_id, p_tool_type, v_usage_month, 1)
  ON CONFLICT (user_id, product_id, tool_type, usage_month)
  DO UPDATE SET
    usage_count = monthly_tool_usage.usage_count + 1,
    updated_at = now()
  RETURNING usage_count INTO v_current_count;

  v_result := json_build_object(
    'count', v_current_count,
    'limit', p_limit,
    'exceeded', false
  );
  RETURN v_result;
END;
$$;

-- Ingest Paper 2 June 2024 for Edexcel Economics Free
INSERT INTO public.document_chunks (product_id, content, metadata) VALUES
('6dc19d53-8a88-4741-9528-f25af97afb21',
'EDEXCEL ECONOMICS PAPER 2 JUNE 2024 - Section A (25 marks)

Question 1(a) [1 mark]: Which is correct about UK household savings as a % of disposable income? A fell in 2015  B fell throughout  C highest in Q1 2017  D highest in Q2 2020
Extract: Chart showing UK household savings %, Q1 2015–Q3 2021.

Question 1(b) [2 marks]: In Q4 2015 average household disposable income was £26,300. Calculate the total amount saved.

Question 1(c) [2 marks]: Explain one likely reason for the change in total household savings from Q1 2020 to Q2 2020.

Question 2(a) [1 mark]: Which is the percentage point fall in investment between April 2020 and July 2020? A 0.1  B 0.6  C 2.1  D 8.9
Extract: Chart showing Investment in the EU, % of GDP, 2019–2021.

Question 2(b) [4 marks]: With reference to the data, explain one likely effect of the fall in investment in 2020.

Question 3(a) [4 marks]: With reference to the information, explain what is meant by market rigging.
Extract: Banks fined €1bn for rigging the foreign exchange market using online chat rooms.

Question 3(b) [1 mark]: Which is a role of financial markets? A discourage saving  B promote moral hazard  C provide forward markets  D restrict free trade

Question 4(a) [1 mark]: Which point on the trade cycle diagram illustrates a boom?

Question 4(b) [4 marks]: In July 2020 the MPC was 0.1. Calculate the total increase in AD from £60m government spending increase.

Question 5(a) [4 marks]: In March 2018 the US imposed a 25% tariff on UK steel imports. Explain the likely impact on the US steel market.

Question 5(b) [1 mark]: Which gives the US comparative advantage in steel? A corporation tax increase  B economic growth  C productivity increase  D wage increase',
'{"content_type": "past_paper", "paper": "Paper 2", "year": "2024", "topic": "Macro Section A", "tier": null}'::jsonb),

('6dc19d53-8a88-4741-9528-f25af97afb21',
'EDEXCEL ECONOMICS PAPER 2 JUNE 2024 - Section B Data Response (50 marks)

Context: UK national debt and fiscal deficit data; interest rates on government bonds; income tax thresholds frozen; QE and monetary policy decisions.

Question 6(a) [5 marks]: With reference to Figure 4, explain the distinction between a progressive and a regressive tax.
Extract: Income tax rates and thresholds 2023–24 vs 2022–23.

Question 6(b) [8 marks]: Examine the likely impact of the freeze in income tax thresholds on aggregate demand.
Extract: Thresholds held to April 2028; additional-rate threshold cut to £125,140; 250,000 taxpayers moved into additional rate.

Question 6(c) [10 marks]: Assess whether a fiscal deficit and national debt should be a cause for concern for the UK government.',
'{"content_type": "past_paper", "paper": "Paper 2", "year": "2024", "topic": "Fiscal Policy Data Response", "tier": null}'::jsonb),

('6dc19d53-8a88-4741-9528-f25af97afb21',
'EDEXCEL ECONOMICS PAPER 2 JUNE 2024 - Section B (continued)

Question 6(d) [12 marks]: With reference to Extract B, discuss the use of quantitative easing in preventing deflation.
Extract: UK monetary policy decisions — March 2020 base rate cut to 0.1% and £200bn QE; later rapid rate rises; QE inflation effects; higher debt interest.

Question 6(e) [15 marks]: Discuss supply-side policies the UK government could introduce to stimulate economic growth.',
'{"content_type": "past_paper", "paper": "Paper 2", "year": "2024", "topic": "Monetary and Supply-side Policy", "tier": null}'::jsonb),

('6dc19d53-8a88-4741-9528-f25af97afb21',
'EDEXCEL ECONOMICS PAPER 2 JUNE 2024 - Section C (25 marks, answer ONE)

Question 7 [25 marks]: In 2021 Brazil''s current account deficit was US$46.12 billion. The Central Bank of Brazil intervened to sell its own currency. Evaluate macroeconomic policies that could be used to reduce a current account deficit. Refer to a country of your choice.

Question 8 [25 marks]: In 2020, exports as a share of world GDP were 12% higher than in 2000, almost twice as high as 50 years ago. Evaluate the possible factors contributing to globalisation.',
'{"content_type": "past_paper", "paper": "Paper 2", "year": "2024", "topic": "Essay Questions", "tier": null}'::jsonb),

-- Ingest Paper 2 June 2023
('6dc19d53-8a88-4741-9528-f25af97afb21',
'EDEXCEL ECONOMICS PAPER 2 JUNE 2023 - Section A (25 marks)

Question 1(a) [4 marks]: Draw an AD/AS diagram to illustrate the likely impact of an increase in the UK base interest rate on average price level and real output.
Extract: Bank of England increased base rate from 1.75% to 2.25% in September 2022.

Question 1(b) [1 mark]: Most likely impact of an increase in the base interest rate? A decrease in: A demand pull inflation  B MPS  C cyclical unemployment  D value of the pound

Question 2(a) [1 mark]: Which is true about the unemployment rate? A fell by 1.4%  B fell by 1pp  C highest in Mar 2022  D will continue to rise
Extract: UK unemployment rate chart, Dec 2020–Jun 2022.

Question 2(b) [4 marks]: Explain one likely reason for the change in UK unemployment.

Question 3(a) [2 marks]: Calculate the value of total forecast GDP in 2022.
Extract: UK real GDP table for 2020–2022 with components.

Question 3(b) [2 marks]: Explain one likely cost of UK real GDP falling by 9.9% in 2020.

Question 3(c) [1 mark]: Which leads to an increase in potential economic growth? A consumption  B raw material costs  C income tax  D technological advances

Question 4(a) [1 mark]: Which is an example of consumption? A New cycle lane  B Heathrow expansion  C New school buildings  D Purchase of new clothes

Question 4(b) [4 marks]: Explain the likely effect of a fall in the MPC on real GDP. Refer to the multiplier.

Question 5(a) [2 marks]: Calculate US national debt in 2021 as a percentage of GDP.

Question 5(b) [2 marks]: Explain the relationship between a fiscal deficit and the national debt.

Question 5(c) [1 mark]: Most likely consequence of increased US national debt? A crowding out  B inequality  C poverty  D unemployment',
'{"content_type": "past_paper", "paper": "Paper 2", "year": "2023", "topic": "Macro Section A", "tier": null}'::jsonb),

('6dc19d53-8a88-4741-9528-f25af97afb21',
'EDEXCEL ECONOMICS PAPER 2 JUNE 2023 - Section B Data Response (50 marks)

Context: Intra- and extra-regional exports data; AfCFTA trade agreement; transport costs in Africa; Angola economic reform and debt relief.

Question 6(a) [5 marks]: With reference to Extract A, explain what is meant by a regional trade agreement.
Extract: AfCFTA aims to reduce tariffs and non-tariff barriers within Africa.

Question 6(b) [8 marks]: Examine two causes of the high cost of transporting goods between African countries.
Extract: Poor infrastructure, queues at borders, rail/port/road issues, market information gaps.

Question 6(c) [12 marks]: Discuss the impact of improved transport links between African countries on economic growth rates.',
'{"content_type": "past_paper", "paper": "Paper 2", "year": "2023", "topic": "Trade and Development Data Response", "tier": null}'::jsonb),

('6dc19d53-8a88-4741-9528-f25af97afb21',
'EDEXCEL ECONOMICS PAPER 2 JUNE 2023 - Section B (continued)

Question 6(d) [10 marks]: Assess two likely benefits of debt relief to Angola.
Extract: Angola oil dependence; debts to China/IMF; debt relief and fiscal stance; privatisation plans.

Question 6(e) [15 marks]: Discuss market-orientated strategies the Angolan government could use to improve development.
Extract: Privatisation plans; move to floating exchange rate; initial kwanza depreciation.',
'{"content_type": "past_paper", "paper": "Paper 2", "year": "2023", "topic": "Development Strategies", "tier": null}'::jsonb),

('6dc19d53-8a88-4741-9528-f25af97afb21',
'EDEXCEL ECONOMICS PAPER 2 JUNE 2023 - Section C (25 marks, answer ONE)

Question 7 [25 marks]: Evaluate macroeconomic policies that could be used to increase international competitiveness in the UK''s export markets.

Question 8 [25 marks]: UK inflation rose to 10.1% in the 12 months to July 2022, compared to 2.0% in July 2021. Evaluate macroeconomic policies, apart from monetary policy, the UK government could use to reduce inflation.',
'{"content_type": "past_paper", "paper": "Paper 2", "year": "2023", "topic": "Essay Questions", "tier": null}'::jsonb);
