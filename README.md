# Rabalata Rides — Otsile Graphics © 2026

A mobile-first private shuttle marketplace starter built with Next.js, Supabase, Mapbox and Paystack. Brand palette: premium black, white and gold. Slogan: **Your Journey. Your Choice. Your Ride.**

## Included in this project

- Responsive public landing page and branded five-second splash screen on page navigation.
- Password-based account creation and sign-in using mobile number + South African ID number + password. No email login and no OTP flow is implemented in the UI.
- Customer dashboard: pickup GPS, destination geocoding, ride requests, cash/card choice, negotiable customer fare, driver counter-offers and shared live map.
- Driver dashboard: vehicle details, vehicle photo capture, driver selfie and ID-document upload to private storage, active-trip GPS sharing, ride requests, counter-offers, wallet ledger view and withdrawal request submission.
- Admin API and dashboard: recent account/ride/vehicle overview, vehicle approval/rejection and maintenance setting. Admin routes are protected by the database role.
- Mapbox driving route line and live pickup/driver/destination markers.
- Paystack transaction initialization, server-side verification and signed webhook validation. Verified card payments credit a driver wallet ledger once via a database function.
- WhatsApp support link to `079 8462 966`.
- Supabase SQL schema, row-level security foundations and private document bucket policies.
- Render deployment instructions.

## Important: not yet a live production service

This source code is a complete starter implementation of the main workflows, but it cannot become a real operating shuttle marketplace until you create and connect the external accounts, configure secrets, complete security/legal reviews, and test on deployed infrastructure. I cannot activate accounts or verify real drivers, vehicles, GPS, card settlement or bank payouts from this project archive. Do not advertise the service as live or accept real passenger bookings until these steps are complete.

## 1. Local setup

Requirements: Node.js 20+.

```bash
cp .env.example .env.local
npm install
npm run dev
```

Open `http://localhost:3000`.

## 2. Supabase setup

1. Create a Supabase project.
2. Run `supabase/schema.sql` in the Supabase SQL Editor.
3. Copy the project URL and anon key into `.env.local`.
4. Add the service-role key as `SUPABASE_SERVICE_ROLE_KEY`. It is server-only and must never use a `NEXT_PUBLIC_` prefix or be committed to Git.
5. In Supabase Auth, enable phone/password sign-in. For the requested no-OTP experience, phone confirmation must be disabled. This reduces account assurance; before public launch, add a proper KYC/identity provider and anti-fraud controls. A password-only phone account does not prove that the person owns that phone number.
6. Configure Auth rate limits, password policy, session settings and production URLs.
7. Confirm the `driver-private` Storage bucket exists and remains private. The SQL creates it and restricts uploads to a user's own folder. Admin signed-document review access still needs to be added and audited before launch.
8. Enable Realtime for `rides` and `driver_locations` tables in the Supabase dashboard.

### Create the first admin safely

Create a normal account using the app, then use the Supabase SQL editor as project owner to grant admin role to its exact auth UUID:

```sql
update public.profiles set role = 'admin' where id = 'YOUR_AUTH_USER_UUID';
```

Never expose admin role selection on public registration. Admin actions use the server-only service role after checking the profile role.

## 3. Mapbox setup

Create a Mapbox account and add the public token to `NEXT_PUBLIC_MAPBOX_TOKEN`. Enable Geocoding and Directions APIs. Browser location requires HTTPS in production (localhost is permitted for development). Drivers must allow GPS while an accepted trip is active. The customer and assigned driver subscribe to the same trip state; access must be tested with separate accounts.

## 4. Card payments and wallet

Add your Paystack secret key to `PAYSTACK_SECRET_KEY` and configure the webhook URL:

`https://YOUR-RENDER-DOMAIN/api/payments/webhook`

Subscribe to `charge.success`. The webhook signature is validated, and a server-side database function checks amount/currency and records the driver's wallet credit once. Test in the provider's test environment before going live. Confirm Paystack has approved your South African business and supports the settlement currency and intended marketplace arrangement.

Paystack checkout requires a customer email for the payment transaction; this is separate from account login. The account login itself does not ask for email and does not send OTP. If you do not want to collect an email even at checkout, choose a payment provider whose hosted card checkout supports your chosen no-email flow.

### Driver payouts

The app allows an eligible, KYC-verified driver to submit a withdrawal request against the available ledger balance. It does not yet execute automatic bank payouts. Configure a payout provider, verified bank-account onboarding, reconciliation, approval controls and idempotent payout webhooks before enabling withdrawals. Do not collect card number or CVV as a payout destination; driver withdrawals normally go to a verified bank account or provider-supported payout instrument.

Cash rides are collected by the driver and are not credited as card funds to the in-app wallet.

## 5. Driver verification and number-plate scanning

The driver can capture/upload the vehicle photo, selfie and ID document. These are stored in a private bucket; no public file URLs are created. The registration number is entered by the driver. True plate OCR, liveness checks, SA ID verification against authoritative records, licence/permit checks and admin document preview/signing links still require approved specialist providers and must be integrated before driver approval. A 13-digit ID format alone is not proof of a real identity.

## 6. Deployment to GitHub and Render

1. Push this project to a private GitHub repository.
2. In Render choose **New + → Web Service**, connect the repository and select Node.
3. Build command: `npm install && npm run build`
4. Start command: `npm run start`
5. Add environment variables from `.env.example` in Render's dashboard.
6. Set `APP_BASE_URL` to your deployed HTTPS URL.
7. Add your Render URL to Supabase Auth allowed URLs and Paystack webhook/callback settings.
8. Deploy and test registration, login, location permissions, realtime, fare negotiation, payment webhook replay, admin approvals and mobile browser behavior.

Render Next.js guide: https://render.com/docs/deploy-nextjs-app

## 7. Production launch checklist

- [ ] South African KYC/identity and driver/vehicle compliance provider.
- [ ] Private document review with staff access audit logs and retention/deletion policy.
- [ ] Number-plate OCR with manual confirmation and tamper checks.
- [ ] RLS review and independent penetration test.
- [ ] Transactional ride acceptance/offer-acceptance locking (current API checks are basic; add DB transactions/RPC to eliminate race conditions under heavy load).
- [ ] Payment provider merchant approval, settlement, refunds, disputes and webhook monitoring.
- [ ] Automated driver payouts, bank verification and reconciliation.
- [ ] Maintenance-mode middleware enforcement and editable CMS content controls.
- [ ] POPIA privacy notice, consent, terms, insurance, permits, support escalation and emergency procedures.
- [ ] Load testing, backups, monitoring and incident response.

**Developed by Otsile Graphics © 2026**
