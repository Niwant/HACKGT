# RXHealth - Healthcare Management Platform

A comprehensive Next.js application for healthcare management with role-based access for physicians and patients.

## Features

### For Physicians
- **Patient Management**: View and manage patient lists with sorting and filtering
- **EMR Integration**: Timeline view of patient records with quick entry forms
- **Prescription Workflow**: Multi-step prescription process with safety checks
- **Drug Research Feed**: Real-time updates on FDA approvals and clinical trials
- **Notifications**: Lab results, follow-up reminders, and alerts
- **AI Summaries**: Generate patient summaries in 30 seconds

### For Patients
- **Medication Management**: Track current prescriptions with detailed information
- **Recovery Timeline**: Monitor health milestones and progress
- **Daily Checklist**: Complete health-related tasks and activities
- **Cost Transparency**: View medication costs and insurance coverage
- **Appointment Tracking**: Manage upcoming visits and check-ups

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Authentication**: Clerk
- **State Management**: React Context API
- **Icons**: Lucide React
- **Date Handling**: date-fns

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Clerk account for authentication

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key_here
CLERK_SECRET_KEY=your_clerk_secret_key_here
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
```

4. Set up Clerk:
   - Create a Clerk account at [clerk.com](https://clerk.com)
   - Create a new application
   - Copy the publishable key and secret key to your `.env.local` file
   - Configure the sign-in and sign-up URLs
   - Note: Users will select their role (Physician/Patient) after signing up

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
src/
├── app/                    # Next.js app router pages
│   ├── dashboard/         # Main dashboard page
│   ├── sign-in/           # Authentication pages
│   ├── sign-up/
│   └── layout.tsx         # Root layout with providers
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── dashboard/        # Dashboard components
│   └── layout/           # Layout components
├── contexts/             # React Context providers
├── types/                # TypeScript type definitions
└── lib/                  # Utility functions
```

## Key Components

### Context API
- `AppContext`: Centralized state management for the entire application
- Manages user data, patients, prescriptions, EMR records, and notifications

### Dashboard Components
- `PhysicianDashboard`: Main interface for physicians
- `PatientDashboard`: Main interface for patients
- `MainLayout`: Common layout with navigation and user menu

### Authentication
- Integrated with Clerk for secure authentication
- Role-based access control (physician/patient)
- Protected routes with middleware

## Development

### Adding New Components
1. Create component in appropriate directory
2. Export from component file
3. Import and use in parent components

### State Management
- Use the `useApp` hook to access global state
- Dispatch actions to update state
- All state updates go through the reducer

### Styling
- Use Tailwind CSS classes
- Follow shadcn/ui component patterns
- Maintain consistent spacing and colors

## Deployment

### Vercel (Recommended)
1. Push code to GitHub
2. Connect repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Other Platforms
- Build the application: `npm run build`
- Start production server: `npm start`
- Ensure all environment variables are set

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please contact the development team.