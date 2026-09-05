-- A gateway reference identifies one provider transaction. Prevent replaying the
-- same provider transaction against multiple payment rows.
CREATE UNIQUE INDEX IF NOT EXISTS uq_payments_gateway_reference
ON public.payments(gateway, gateway_reference)
WHERE gateway_reference IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_payments_reference_status
ON public.payments(reference, status);
