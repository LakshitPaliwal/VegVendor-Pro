'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Store, 
  Package, 
  Users, 
  Scale, 
  BarChart3, 
  FileText, 
  ShoppingCart, 
  Receipt, 
  Calendar,
  CheckCircle,
  Upload,
  Eye,
  ArrowLeft,
  Mail,
  Phone,
  Code,
  Shield,
  Zap,
  Database,
  Cloud,
  Smartphone
} from 'lucide-react';
import Link from 'next/link';

export default function AboutPage() {
  const features = [
    {
      icon: <Package className="h-6 w-6 text-green-600" />,
      title: "Purchase Management",
      description: "Record and track all wholesale purchases with detailed vendor information, weights, and pricing."
    },
    {
      icon: <Scale className="h-6 w-6 text-blue-600" />,
      title: "Weight Verification",
      description: "Verify actual received weights against ordered quantities and track discrepancies automatically."
    },
    {
      icon: <Users className="h-6 w-6 text-purple-600" />,
      title: "Vendor Management",
      description: "Maintain comprehensive vendor profiles with contact details, locations, and purchase history."
    },
    {
      icon: <Store className="h-6 w-6 text-orange-600" />,
      title: "Inventory Tracking",
      description: "Real-time inventory management with automatic stock updates based on purchases and sales."
    },
    {
      icon: <ShoppingCart className="h-6 w-6 text-red-600" />,
      title: "Sales Recording",
      description: "Track retail sales with customer information and multiple payment methods support."
    },
    {
      icon: <Receipt className="h-6 w-6 text-yellow-600" />,
      title: "Expense Management",
      description: "Categorize and track business expenses including transportation, storage, utilities, and more."
    },
    {
      icon: <BarChart3 className="h-6 w-6 text-indigo-600" />,
      title: "Financial Reports",
      description: "Comprehensive analytics with profit/loss tracking, vendor analysis, and tax reports."
    },
    {
      icon: <FileText className="h-6 w-6 text-teal-600" />,
      title: "Bill Management",
      description: "Upload and manage both parent bills (all items) and child bills (individual items) with viewing capabilities."
    },
    {
      icon: <Package className="h-6 w-6 text-pink-600" />,
      title: "Crates Tracking",
      description: "Track crates that need to be returned to wholesale vendors with status monitoring."
    }
  ];

  const technologies = [
    { name: "Next.js 13", description: "React framework for production" },
    { name: "TypeScript", description: "Type-safe JavaScript" },
    { name: "Firebase", description: "Backend-as-a-Service platform" },
    { name: "Firestore", description: "NoSQL cloud database" },
    { name: "Redux Toolkit", description: "State management" },
    { name: "Tailwind CSS", description: "Utility-first CSS framework" },
    { name: "Shadcn/UI", description: "Modern UI components" },
    { name: "Recharts", description: "Data visualization" }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Header */}
        <div className="mb-6">
          <Link href="/">
            <Button variant="outline" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <div className="text-center mb-8">
            <div className="bg-green-600 p-4 rounded-full w-20 h-20 mx-auto mb-4">
              <Store className="h-12 w-12 text-white" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">VegVendor Pro</h1>
            <p className="text-xl text-gray-600 mb-4">Complete Retail Vegetable Management System</p>
            <Badge variant="outline" className="text-green-700 border-green-200 bg-green-50">
              Version 1.0 - 2025
            </Badge>
          </div>
        </div>

        {/* App Overview */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl text-center">About VegVendor Pro</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center space-y-4">
              <p className="text-lg text-gray-700 leading-relaxed">
                VegVendor Pro is a comprehensive business management solution designed specifically for retail vegetable vendors. 
                It streamlines the entire supply chain from wholesale purchasing to retail sales, providing powerful tools for 
                inventory management, financial tracking, and business analytics.
              </p>
              <p className="text-gray-600">
                Built with modern web technologies, this application offers a seamless experience across all devices, 
                helping vendors make data-driven decisions and optimize their business operations.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Key Features */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl">Key Features & Capabilities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, index) => (
                <div key={index} className="flex items-start space-x-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="bg-gray-100 p-2 rounded-lg">
                    {feature.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
                    <p className="text-sm text-gray-600">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Detailed Capabilities */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Purchase & Inventory Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Package className="h-5 w-5 text-green-600" />
                <span>Purchase & Inventory Management</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">Multi-vendor purchase recording</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">Weight verification with discrepancy tracking</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">Real-time inventory updates</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">Crate tracking and return management</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">Vegetable and fruit categorization</span>
              </div>
            </CardContent>
          </Card>

          {/* Financial Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                <span>Financial Management</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-blue-600" />
                <span className="text-sm">Comprehensive profit/loss analysis</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-blue-600" />
                <span className="text-sm">Vendor-wise profitability tracking</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-blue-600" />
                <span className="text-sm">Expense categorization and tracking</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-blue-600" />
                <span className="text-sm">GST and tax reporting</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-blue-600" />
                <span className="text-sm">Interactive charts and visualizations</span>
              </div>
            </CardContent>
          </Card>

          {/* Bill Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-purple-600" />
                <span>Advanced Bill Management</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-2">
                <Upload className="h-4 w-4 text-purple-600" />
                <span className="text-sm">Parent bills for all items on a date</span>
              </div>
              <div className="flex items-center space-x-2">
                <Upload className="h-4 w-4 text-purple-600" />
                <span className="text-sm">Child bills for individual items</span>
              </div>
              <div className="flex items-center space-x-2">
                <Eye className="h-4 w-4 text-purple-600" />
                <span className="text-sm">View and manage uploaded bills</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-purple-600" />
                <span className="text-sm">Image compression for storage optimization</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-purple-600" />
                <span className="text-sm">Support for PDF, JPG, PNG formats</span>
              </div>
            </CardContent>
          </Card>

          {/* User Experience */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Smartphone className="h-5 w-5 text-orange-600" />
                <span>User Experience</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-orange-600" />
                <span className="text-sm">Responsive design for all devices</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-orange-600" />
                <span className="text-sm">Intuitive dashboard with key metrics</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-orange-600" />
                <span className="text-sm">Advanced search and filtering</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-orange-600" />
                <span className="text-sm">Date-based data organization</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-orange-600" />
                <span className="text-sm">Real-time data synchronization</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Technology Stack */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Code className="h-5 w-5 text-indigo-600" />
              <span>Technology Stack</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {technologies.map((tech, index) => (
                <div key={index} className="text-center p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <h3 className="font-semibold text-gray-900 mb-1">{tech.name}</h3>
                  <p className="text-xs text-gray-600">{tech.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Security & Performance */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-green-600" />
                <span>Security Features</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">Firebase Authentication</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">Secure data encryption</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">Role-based access control</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">Secure file storage</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Zap className="h-5 w-5 text-yellow-600" />
                <span>Performance & Reliability</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-yellow-600" />
                <span className="text-sm">Cloud-based infrastructure</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-yellow-600" />
                <span className="text-sm">Real-time data synchronization</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-yellow-600" />
                <span className="text-sm">Automatic backups</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-yellow-600" />
                <span className="text-sm">Optimized for mobile devices</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Developer Information */}
        <Card className="mb-8 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-2xl text-center text-blue-900">Developer Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center space-y-6">
              <div className="bg-white p-6 rounded-lg shadow-sm border border-blue-100">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Software Developed by</h3>
                <div className="text-2xl font-bold text-blue-600 mb-2">Lakshit Palliwal</div>
                <p className="text-gray-600 mb-4">Software Engineer</p>
                
                <Separator className="my-4" />
                
                <div className="space-y-3">
                  <div className="flex items-center justify-center space-x-3">
                    <Mail className="h-5 w-5 text-blue-600" />
                    <a 
                      href="mailto:lakshitpaliwal27@gmail.com" 
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      lakshitpaliwal27@gmail.com
                    </a>
                  </div>
                  <div className="flex items-center justify-center space-x-3">
                    <Phone className="h-5 w-5 text-green-600" />
                    <a 
                      href="tel:+919462628513" 
                      className="text-green-600 hover:text-green-800 font-medium"
                    >
                      +91 94 62 62 8513
                    </a>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-900 text-white p-4 rounded-lg">
                <p className="text-sm">
                  © 2025 Lakshit Palliwal. All rights reserved.
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  VegVendor Pro - Professional Vegetable Vendor Management System
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Call to Action */}
        <div className="text-center">
          <Link href="/">
            <Button size="lg" className="bg-green-600 hover:bg-green-700">
              <Store className="h-5 w-5 mr-2" />
              Start Managing Your Business
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}