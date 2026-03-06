# Squidgy Frontend Coding Standards & Architecture

This document outlines the sophisticated coding standards and architectural patterns used in the Squidgy frontend, designed for clarity, maintainability, and professional-grade development practices.

> **📖 Related**: See [Agent Creation Guide](agents/README.md) for creating new AI agents with Python script

---

## 🏗️ Architecture & Design Philosophy

### **Perpetual Design Principles**
- **Component Composition**: Atomic design with reusable, composable components
- **Type Safety**: Full TypeScript implementation with strict typing
- **Design System**: Consistent UI patterns using Radix UI + Tailwind CSS
- **Accessibility**: WCAG 2.1 AA compliance built-in
- **Performance**: Optimized rendering with React best practices

### **Tech Stack**
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **Styling**: Tailwind CSS with custom design tokens
- **UI Components**: Radix UI primitives for accessibility
- **State Management**: React Query for server state, React hooks for local state
- **Routing**: React Router v6 with type-safe navigation

---

## 📁 Project Structure

```
client/
├── components/           # Reusable UI components
│   └── ui/              # Base UI primitives (shadcn/ui pattern)
├── pages/               # Route-level components
├── hooks/               # Custom React hooks
├── lib/                 # Utility functions and configurations
├── types/               # TypeScript type definitions
└── assets/              # Static assets
```

### **File Naming Conventions**
- **Components**: `PascalCase.tsx` (e.g., `WebsiteDetails.tsx`)
- **Hooks**: `camelCase.ts` with `use-` prefix (e.g., `use-mobile.tsx`)
- **Utilities**: `camelCase.ts` (e.g., `utils.ts`)
- **Types**: `camelCase.ts` with descriptive names (e.g., `api-types.ts`)

---

## 🎨 Design System Implementation

### **Color Palette**
```typescript
// Brand Colors (Squidgy Gradient)
squidgy: {
  purple: "#5E17EB",
  pink: "#A61D92", 
  red: "#FB252A",
  blue: "#6017E8"
}

// Semantic Colors
text: {
  primary: "#232534",    // High contrast text
  secondary: "#444652",  // Medium contrast text
  subtle: "#656671"      // Low contrast text
}

// UI Colors
grey: {
  200: "#444652",        // Dark grey
  500: "rgba(35, 37, 52, 0.40)", // Semi-transparent
  700: "#D3D3D6",        // Light grey
  800: "#E5E5E7",        // Very light grey
  900: "#F0F0F1"         // Background grey
}
```

### **Typography System**
```css
/* Primary Font Stack */
font-family: 'Open Sans', 'Inter', '-apple-system', 'Roboto', 'Helvetica', sans-serif;

/* Hierarchy */
.text-2xl { font-size: 1.5rem; font-weight: 600; } /* Page titles */
.text-xl  { font-size: 1.25rem; font-weight: 600; } /* Section headers */
.text-lg  { font-size: 1.125rem; font-weight: 600; } /* Subsection headers */
.text-base { font-size: 1rem; } /* Body text */
.text-sm  { font-size: 0.875rem; } /* Secondary text */
.text-xs  { font-size: 0.75rem; } /* Captions */
```

### **Spacing & Layout**
```css
/* Consistent spacing scale */
gap-2: 0.5rem    /* 8px - Tight spacing */
gap-3: 0.75rem   /* 12px - Default spacing */
gap-4: 1rem      /* 16px - Medium spacing */
gap-6: 1.5rem    /* 24px - Large spacing */
gap-8: 2rem      /* 32px - Section spacing */

/* Border radius system */
rounded-md: 6px      /* Small elements */
rounded-lg: 8px      /* Cards, inputs */
rounded-xl: 12px     /* Chat bubbles */
rounded-2xl: 16px    /* Large containers */
```

---

## 🧩 Component Architecture

### **Component Structure Pattern**
```typescript
// 1. Imports (grouped and ordered)
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// 2. Type definitions
interface ComponentProps {
  title: string;
  onSubmit: (data: FormData) => void;
  className?: string;
}

// 3. Sub-components (if any)
function SubComponent({ prop }: { prop: string }) {
  return <div>{prop}</div>;
}

// 4. Main component
export default function MainComponent({ title, onSubmit, className }: ComponentProps) {
  // Hooks first
  const navigate = useNavigate();
  const [state, setState] = useState<string>("");
  
  // Event handlers
  const handleSubmit = () => {
    // Implementation
  };
  
  // Render
  return (
    <div className={cn("base-classes", className)}>
      {/* JSX content */}
    </div>
  );
}
```

### **UI Component Standards**
```typescript
// shadcn/ui pattern with forwardRef and variants
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
```

---

## 🎯 State Management Patterns

### **Local State**
```typescript
// Simple state with TypeScript
const [isLoading, setIsLoading] = useState<boolean>(false);
const [formData, setFormData] = useState<FormData>({
  name: "",
  email: "",
  website: ""
});

// Complex state with reducer pattern
const [state, dispatch] = useReducer(formReducer, initialState);
```

### **Server State (React Query)**
```typescript
// API calls with React Query
const { data, isLoading, error } = useQuery({
  queryKey: ['website-analysis', websiteUrl],
  queryFn: () => analyzeWebsite(websiteUrl),
  enabled: !!websiteUrl
});

// Mutations for form submissions
const mutation = useMutation({
  mutationFn: createBusinessSetup,
  onSuccess: (data) => {
    navigate('/next-step');
  },
  onError: (error) => {
    toast.error(error.message);
  }
});
```

---

## 🔧 Utility Functions & Helpers

### **Class Name Utility**
```typescript
// cn() function for conditional classes
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Usage
<div className={cn(
  "base-classes",
  isActive && "active-classes",
  className
)} />
```

### **Custom Hooks Pattern**
```typescript
// Mobile detection hook
export function useIsMobile() {
  const [isMobile, setIsMobile] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    
    mql.addEventListener("change", onChange);
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return !!isMobile;
}
```

---

## 📱 Responsive Design Standards

### **Breakpoint System**
```typescript
// Mobile-first approach
const MOBILE_BREAKPOINT = 768;

// Tailwind breakpoints
sm: '640px'   // Small devices
md: '768px'   // Medium devices  
lg: '1024px'  // Large devices
xl: '1280px'  // Extra large devices
2xl: '1400px' // Container max-width
```

### **Layout Patterns**
```typescript
// Responsive sidebar pattern
<div className="flex-1 flex">
  {/* Mobile: Hidden by default, shown in overlay */}
  <div className="hidden lg:block">
    <Sidebar />
  </div>
  
  {/* Mobile overlay */}
  {sidebarOpen && (
    <div className="fixed inset-0 bg-black/50 z-50 lg:hidden">
      <Sidebar />
    </div>
  )}
</div>
```

---

## 🚀 Performance Optimization

### **Code Splitting**
```typescript
// Lazy loading for routes
const WebsiteDetails = lazy(() => import('./pages/WebsiteDetails'));
const BusinessDetails = lazy(() => import('./pages/BusinessDetails'));

// Suspense wrapper
<Suspense fallback={<LoadingSpinner />}>
  <Routes>
    <Route path="/website-details" element={<WebsiteDetails />} />
  </Routes>
</Suspense>
```

### **Memoization Patterns**
```typescript
// Expensive calculations
const expensiveValue = useMemo(() => {
  return heavyCalculation(data);
}, [data]);

// Event handlers
const handleSubmit = useCallback((formData: FormData) => {
  onSubmit(formData);
}, [onSubmit]);

// Component memoization
const MemoizedComponent = memo(({ data }: Props) => {
  return <div>{data}</div>;
});
```

---

## 🧪 Testing Standards

### **Component Testing**
```typescript
// React Testing Library pattern
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

describe('Button Component', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button')).toHaveTextContent('Click me');
  });

  it('calls onClick handler', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

---

## 📋 Code Quality Standards

### **ESLint Configuration**
```json
{
  "extends": [
    "@typescript-eslint/recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended"
  ],
  "rules": {
    "react/prop-types": "off",
    "@typescript-eslint/no-unused-vars": "error",
    "prefer-const": "error"
  }
}
```

### **Prettier Configuration**
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": false,
  "printWidth": 80,
  "tabWidth": 2
}
```

---

## 🔒 Security Best Practices

### **Input Validation**
```typescript
// Zod schema validation
import { z } from 'zod';

const websiteSchema = z.object({
  url: z.string().url('Please enter a valid URL'),
  businessName: z.string().min(1, 'Business name is required'),
  email: z.string().email('Please enter a valid email')
});

type WebsiteFormData = z.infer<typeof websiteSchema>;
```

### **Environment Variables**
```typescript
// Type-safe environment variables
interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
}

// Usage
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
```

---

## 📚 Documentation Standards

### **Component Documentation**
```typescript
/**
 * WebsiteDetails component for collecting and analyzing website information
 * 
 * @param onSubmit - Callback function called when form is submitted
 * @param initialData - Optional initial form data
 * @returns JSX.Element
 * 
 * @example
 * ```tsx
 * <WebsiteDetails 
 *   onSubmit={(data) => console.log(data)}
 *   initialData={{ url: 'example.com' }}
 * />
 * ```
 */
export default function WebsiteDetails({ onSubmit, initialData }: Props) {
  // Implementation
}
```

### **README Structure**
```markdown
# Component Name

## Overview
Brief description of the component's purpose.

## Props
| Prop | Type | Required | Description |
|------|------|----------|-------------|
| title | string | Yes | The component title |

## Usage
```tsx
<Component title="Example" />
```

## Styling
Custom CSS classes and Tailwind utilities used.
```

---

## 🎨 Animation & Interaction Standards

### **Micro-interactions**
```css
/* Smooth transitions */
.transition-colors { transition: color 150ms ease-in-out; }
.transition-opacity { transition: opacity 200ms ease-in-out; }

/* Hover states */
.hover\:bg-gray-100:hover { background-color: #f3f4f6; }
.hover\:opacity-90:hover { opacity: 0.9; }

/* Focus states */
.focus\:ring-2:focus { 
  ring-width: 2px; 
  ring-color: var(--squidgy-purple);
}
```

### **Loading States**
```typescript
// Skeleton loading pattern
function SkeletonCard() {
  return (
    <div className="animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
    </div>
  );
}

// Conditional rendering
{isLoading ? <SkeletonCard /> : <ActualContent />}
```

---

## 🔄 Form Handling Standards

### **Form Validation Pattern**
```typescript
// React Hook Form with Zod
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const form = useForm<FormData>({
  resolver: zodResolver(formSchema),
  defaultValues: {
    website: "",
    businessName: "",
    email: ""
  }
});

const onSubmit = (data: FormData) => {
  mutation.mutate(data);
};
```

### **Error Handling**
```typescript
// Consistent error display
{form.formState.errors.website && (
  <p className="text-sm text-red-600 mt-1">
    {form.formState.errors.website.message}
  </p>
)}

// Toast notifications for global errors
import { toast } from 'sonner';

toast.error('Something went wrong. Please try again.');
toast.success('Settings saved successfully!');
```

---

## 📊 Monitoring & Analytics

### **Error Boundaries**
```typescript
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback />;
    }

    return this.props.children;
  }
}
```

---

## 🎯 Summary

This coding standard ensures:
- **Consistency**: Uniform patterns across all components
- **Maintainability**: Clear structure and documentation
- **Performance**: Optimized rendering and loading
- **Accessibility**: WCAG compliance built-in
- **Type Safety**: Full TypeScript coverage
- **Scalability**: Modular architecture for growth

The Squidgy frontend follows these standards to deliver a sophisticated, professional-grade user experience that matches perpetual design principles.
