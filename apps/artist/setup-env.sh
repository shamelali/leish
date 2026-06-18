#!/bin/bash

# Setup script for Vercel environment variables
# Run: curl -sSL https://raw.githubusercontent.com/user/leish/apps/artist/setup-env.sh | bash

echo "Setting up environment variables for artist app..."

# Backup existing .env.local if it exists
if [ -f .env.local ]; then
  echo ".env.local already exists, backing up to .env.local.backup"
  cp .env.local .env.local.backup
fi

# Create .env.local with template values
# Replace the example values with your actual values

cat > .env.local << 'EOL'
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key-here
DATABASE_URL=postgresql://postgres:password@db.your-project-ref.supabase.co:5432/postgres

# Brevo SMTP Email (for Supabase Auth)
BREVO_API_KEY=your-brevo-api-key-here
FROM_EMAIL=hello@leish.my
FROM_NAME=Leish
SMTP_MASTER_PASSWORD=xsmtpsib-your-smtp-password-here

# Billplz Payments
BILLPLZ_API_KEY=your-billplz-api-key-here
BILLPLZ_SECRET=your-billplz-secret-here

# App Configuration
NEXT_PUBLIC_APP_URL=https://artist.leish.my

# Optional: Disable auto-confirm for testing
# AUTO_CONFIRM_EMAILS=true
EOL

echo "✅ .env.local created successfully!"
echo ""
echo "Next steps:"
echo "1. Edit .env.local with your actual values:"
echo "   nano .env.local"
echo "2. Get real values from:"
echo "   - Supabase Dashboard → Settings → API"
echo "   - Brevo Dashboard → API Keys"
echo "   - Billplz Dashboard → API Keys"
echo "3. Test the setup:"
echo "   pnpm typecheck"
echo "4. Start the dev server:"
echo "   pnpm dev"
echo ""
echo "For Vercel deployment, copy these values to the Vercel dashboard:"
echo "Settings → Environment Variables → Add Variables"

exit 0
