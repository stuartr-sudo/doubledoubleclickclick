-- Enable the account balance display in the UI
INSERT INTO public.feature_flags (
  flag_name,
  description,
  is_enabled,
  created_date,
  updated_date
) VALUES (
  'show_account_balance',
  'Shows the account balance in the top menu bar',
  true,
  now(),
  now()
)
ON CONFLICT (flag_name)
DO UPDATE SET
  is_enabled = true,
  updated_date = now();

-- Also update the old flag name if it exists
UPDATE public.feature_flags
SET 
  flag_name = 'show_account_balance',
  description = 'Shows the account balance in the top menu bar',
  is_enabled = true,
  updated_date = now()
WHERE flag_name = 'show_token_balance';

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';

-- Verify
SELECT flag_name, description, is_enabled
FROM public.feature_flags
WHERE flag_name IN ('show_account_balance', 'show_token_balance');

