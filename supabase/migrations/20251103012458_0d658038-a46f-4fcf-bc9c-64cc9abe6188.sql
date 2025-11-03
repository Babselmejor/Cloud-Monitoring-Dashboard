-- Allow INSERT operations on services, metrics, and alerts for simulation
-- This enables the real-time simulation to work

-- Services: Allow anyone to insert (for simulation purposes)
CREATE POLICY "Allow public insert on services"
ON public.services
FOR INSERT
TO public
WITH CHECK (true);

-- Metrics: Allow anyone to insert (for simulation purposes)
CREATE POLICY "Allow public insert on metrics"
ON public.metrics
FOR INSERT
TO public
WITH CHECK (true);

-- Alerts: Allow anyone to insert (for simulation purposes)
CREATE POLICY "Allow public insert on alerts"
ON public.alerts
FOR INSERT
TO public
WITH CHECK (true);

-- Also allow updates to simulate service status changes
CREATE POLICY "Allow public update on services"
ON public.services
FOR UPDATE
TO public
USING (true)
WITH CHECK (true);