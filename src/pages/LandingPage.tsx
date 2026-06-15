import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Sprout, 
  MapPin, 
  CloudSun, 
  ScanLine, 
  ShoppingBag, 
  FileText,
  Stethoscope,
  Truck,
  Store,
  Users,
  ArrowRight,
  CheckCircle2,
  Leaf,
  Zap,
  Shield,
  Bell
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import heroImage from '@/assets/hero-farm.jpg';

const features = [
  {
    icon: MapPin,
    title: 'Farm Mapping',
    description: 'Mark your farm boundaries and calculate area in acres using interactive maps.',
    color: 'text-primary',
    bg: 'bg-primary/10',
  },
  {
    icon: CloudSun,
    title: 'Weather & AI Crops',
    description: 'Get AI-powered crop recommendations based on weather, soil, and season.',
    color: 'text-info',
    bg: 'bg-info/10',
  },
  {
    icon: ScanLine,
    title: 'Disease Detection',
    description: 'Upload plant images for instant AI disease detection with cure steps.',
    color: 'text-warning',
    bg: 'bg-warning/10',
  },
  {
    icon: ShoppingBag,
    title: 'Direct Selling',
    description: 'Sell directly to consumers. No middlemen. Fair prices for everyone.',
    color: 'text-success',
    bg: 'bg-success/10',
  },
  {
    icon: FileText,
    title: 'Govt Schemes',
    description: 'Discover government schemes you qualify for with step-by-step guidance.',
    color: 'text-secondary',
    bg: 'bg-secondary/10',
  },
  {
    icon: Stethoscope,
    title: 'Vet Consultation',
    description: 'Connect with verified veterinary doctors for online consultations.',
    color: 'text-destructive',
    bg: 'bg-destructive/10',
  },
];

const stats = [
  { value: '50K+', label: 'Farmers' },
  { value: '1M+', label: 'Hectares Mapped' },
  { value: '98%', label: 'Accuracy Rate' },
  { value: '₹10Cr+', label: 'Direct Sales' },
];

const roles = [
  { icon: Sprout, label: 'Farmers', desc: 'Grow smarter' },
  { icon: Users, label: 'Consumers', desc: 'Buy fresh' },
  { icon: Stethoscope, label: 'Vets', desc: 'Help animals' },
  { icon: Store, label: 'Retailers', desc: 'Sell supplies' },
  { icon: Truck, label: 'Delivery', desc: 'Earn more' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-xl font-bold">
            <div className="p-2 rounded-xl bg-primary/10">
              <Sprout className="h-6 w-6 text-primary" />
            </div>
            <span className="text-foreground">Farmaline</span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Features</a>
            <a href="#how-it-works" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">How it works</a>
            <a href="#roles" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">For Everyone</a>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <button className="p-2 rounded-full bg-muted border border-border hover:border-primary/30 transition-colors">
                <Bell className="h-5 w-5 text-foreground" />
              </button>
              <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full"></span>
            </div>
            <Link to="/login">
              <Button variant="outline">Sign in</Button>
            </Link>
            <Link to="/register">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden hero-gradient">
        <div className="absolute top-1/4 -left-20 w-80 h-80 bg-primary/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-accent/5 rounded-full blur-3xl"></div>
        
        <div className="container mx-auto px-4 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className="text-center lg:text-left"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-6">
                <Zap className="h-4 w-4" />
                AI-Powered Agriculture
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight mb-6 text-foreground">
                Grow Smarter.
                <br />
                <span className="text-gradient-primary">Earn Better.</span>
              </h1>
              <p className="text-lg text-muted-foreground mb-8 max-w-lg mx-auto lg:mx-0">
                The all-in-one platform connecting farmers, consumers, veterinarians, and delivery partners. 
                AI-powered insights, zero middlemen.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link to="/register">
                  <Button variant="hero" size="xl">
                    Start for Free
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </Button>
                </Link>
                <Link to="/login">
                  <Button variant="glass" size="xl">
                    Watch Demo
                  </Button>
                </Link>
              </div>
              <div className="flex items-center gap-6 mt-8 justify-center lg:justify-start text-sm text-muted-foreground">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  Free to start
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  No credit card
                </span>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="relative"
            >
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-border">
                <img 
                  src={heroImage} 
                  alt="Modern agriculture with drone technology" 
                  className="w-full h-auto"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
              </div>
              {/* Floating cards */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
                className="absolute -left-4 top-1/4 glass rounded-xl p-4 shadow-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-success/20">
                    <Leaf className="h-5 w-5 text-success" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Crop Health</p>
                    <p className="font-bold text-success">98% Healthy</p>
                  </div>
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.8 }}
                className="absolute -right-4 bottom-1/4 glass rounded-xl p-4 shadow-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/20">
                    <Shield className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">AI Verified</p>
                    <p className="font-bold text-foreground">Quality Score: A+</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 border-y border-border bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <p className="text-3xl md:text-4xl font-bold text-primary">{stat.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
              Everything You Need to
              <span className="text-primary"> Farm Smarter</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              From AI-powered crop planning to direct consumer sales, 
              we've got every aspect of modern farming covered.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="feature-card group"
              >
                <div className={`inline-flex p-3 rounded-xl ${feature.bg} mb-4 group-hover:scale-110 transition-transform`}>
                  <feature.icon className={`h-6 w-6 ${feature.color}`} />
                </div>
                <h3 className="text-xl font-bold mb-2 text-foreground">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Roles */}
      <section id="roles" className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
              Built for <span className="text-primary">Everyone</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Whether you're growing, buying, healing, selling, or delivering – there's a place for you.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            {roles.map((role, i) => (
              <motion.div
                key={role.label}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-card border border-border rounded-2xl p-6 text-center card-hover"
              >
                <div className="inline-flex p-4 rounded-full bg-primary/10 text-primary mb-4">
                  <role.icon className="h-8 w-8" />
                </div>
                <h3 className="font-bold text-lg text-foreground">{role.label}</h3>
                <p className="text-sm text-muted-foreground">{role.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative overflow-hidden rounded-3xl p-12 md:p-16 text-center"
            style={{ background: 'var(--gradient-primary)' }}
          >
            <div className="absolute top-10 left-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-10 right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
                Ready to Transform Your Farm?
              </h2>
              <p className="text-lg text-primary-foreground/80 mb-8 max-w-xl mx-auto">
                Join thousands of farmers already using Farmaline to grow smarter and earn better.
              </p>
              <Link to="/register">
                <Button size="xl" className="bg-white text-primary hover:bg-white/90 font-bold shadow-lg">
                  Get Started Free
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border bg-background">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xl font-bold">
              <div className="p-2 rounded-xl bg-primary/10">
                <Sprout className="h-6 w-6 text-primary" />
              </div>
              <span className="text-foreground">Farmaline</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2025 Farmaline. Empowering farmers with AI.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
