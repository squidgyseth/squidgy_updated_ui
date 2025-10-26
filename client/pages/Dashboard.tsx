import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { authService } from "@/lib/auth-service";
import LeftNavigation from "../components/layout/LeftNavigation";
import NotificationBell from "../components/NotificationBell";
import { 
  MessageCircle, 
  Home, 
  Menu, 
  LogOut, 
  Search, 
  Bell, 
  Settings, 
  CheckCircle, 
  Target, 
  TrendingUp, 
  Award,
  Plus,
  Play,
  Lightbulb,
  ArrowRight,
  Eye,
  MapPin,
  Users,
  Clock,
  BarChart3,
  Calendar,
  Zap
} from "lucide-react";

export default function Index() {
  const [activeTab, setActiveTab] = useState("weekly");
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white">
      {/* Reusable Left Navigation */}
      <LeftNavigation currentPage="dashboard" />

      {/* Main Content */}
      <div className="ml-[60px] bg-gray-50 p-8">
        <div className="max-w-full mx-auto space-y-6 px-4">
          {/* Header */}
          <div className="flex items-center justify-between bg-gray-50 pb-8 border-b border-gray-200">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <img 
                  src="https://api.builder.io/api/v1/image/assets/TEMP/e6ed19c13dbe3dffb61007c6e83218b559da44fe?width=290"
                  alt="Squidgy"
                  className="w-[100px] h-[40px]"
                />
                <div>
                  <h1 className="text-[15px] font-bold text-black font-open-sans">Dashboard</h1>
                  <p className="text-[11px] text-gray-500 font-open-sans">AI that works like a team — built for the way you work</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full">
                <Search className="w-6 h-6 text-gray-500" />
              </Button>
              
              <NotificationBell />
              
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">WasteLess Team</p>
                  <p className="text-xs text-gray-500">wasteless@gmail.com</p>
                </div>
                <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Welcome Section */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-[29px] font-bold text-gray-900 font-open-sans">Good afternoon, Alesja! 🙌</h1>
              <p className="text-[15px] text-gray-600 font-open-sans">Your AI-powered solar sales command center - never miss a lead again</p>
            </div>
            
            <div className="flex items-center gap-3">
              <Badge className="bg-green-100 text-green-800 hover:bg-green-100 px-3 py-1">
                AI Assistant Active
              </Badge>
              <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100 px-3 py-1">
                3 Urgent Follow-ups
              </Badge>
              <button 
                onClick={() => navigate('/welcome')}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm transition-colors"
              >
                <Plus className="w-4 h-4" />
                Create Agent
              </button>
              <div className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-full bg-gray-100 text-gray-700 text-sm">
                <Settings className="w-4 h-4" />
                Settings
              </div>
            </div>
          </div>

          {/* Solar Sales Assistant Card */}
          <Card className="border-2 border-squidgy-red bg-purple-50">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <img 
                  src="https://api.builder.io/api/v1/image/assets/TEMP/09c4998d4dacea2a22e91eb5243c5cac2433e507?width=128" 
                  alt="Solar panel icon" 
                  className="w-16 h-16 rounded-full"
                />
                <div className="flex-1">
                  <h2 className="text-[20px] font-bold text-gray-900 font-open-sans">Solar Sales Assistant</h2>
                  <p className="text-[15px] text-gray-600 font-open-sans mt-1">Your 24/7 solar sales expert that qualifies leads, nurtures prospects, and converts interest into installations.</p>
                </div>
                <Button className="bg-squidgy-gradient text-white gap-2 px-7 py-3">
                  <MessageCircle className="w-6 h-6" />
                  Start Chat
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Feature Cards Row */}
          <div className="grid grid-cols-4 gap-6">
            <Card className="border border-green-200 bg-green-50">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-white" />
                  </div>
                </div>
                <h3 className="text-[17px] font-bold text-gray-900 font-open-sans mb-2">Never Miss a Lead</h3>
                <p className="text-[15px] text-gray-700 font-open-sans mb-4">100% response rate with instant replies to all enquiries, 24/7</p>
                <p className="text-[13px] text-green-600 font-open-sans">Zero missed opportunities</p>
              </CardContent>
            </Card>

            <Card className="border border-purple-200 bg-purple-50">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                    <Target className="w-5 h-5 text-white" />
                  </div>
                </div>
                <h3 className="text-[17px] font-bold text-gray-900 font-open-sans mb-2">Smart Qualification</h3>
                <p className="text-[15px] text-gray-700 font-open-sans mb-4">AI assesses roof suitability, budget, and readiness automatically</p>
                <p className="text-[13px] text-purple-600 font-open-sans">Higher quality leads</p>
              </CardContent>
            </Card>

            <Card className="border border-red-200 bg-red-50">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                </div>
                <h3 className="text-[18px] font-bold text-gray-900 font-open-sans mb-2">Boost Conversions</h3>
                <p className="text-[15px] text-gray-700 font-open-sans mb-4">Personalized energy reports and ROI calculations increase sales</p>
                <p className="text-[13px] text-red-600 font-open-sans">+8.1% conversion rate</p>
              </CardContent>
            </Card>

            <Card className="border border-yellow-200 bg-yellow-50">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center">
                    <Award className="w-5 h-5 text-white" />
                  </div>
                </div>
                <h3 className="text-[17px] font-bold text-gray-900 font-open-sans mb-2">Customer Delight</h3>
                <p className="text-[15px] text-gray-700 font-open-sans mb-4">Knowledgeable responses and proactive follow-ups build trust</p>
                <p className="text-[13px] text-yellow-600 font-open-sans">4.8/5 satisfaction</p>
              </CardContent>
            </Card>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-4 gap-6">
            {/* New Leads */}
            <Card className="bg-squidgy-gradient text-white">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-sm text-white/80 font-open-sans">New Leads</p>
                    <div className="flex items-baseline gap-2">
                      <h3 className="text-2xl font-bold font-open-sans">47</h3>
                      <span className="text-xs text-white/70 font-open-sans">this week</span>
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center">
                    <Target className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div className="flex items-center gap-1 text-sm">
                  <TrendingUp className="w-4 h-4 text-green-400" />
                  <span className="text-green-400 font-open-sans">+23.5%</span>
                </div>
              </CardContent>
            </Card>

            {/* Surveys Booked */}
            <Card>
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-sm text-gray-500 font-open-sans">Surveys Booked</p>
                    <h3 className="text-2xl font-bold text-gray-900 font-open-sans">23</h3>
                  </div>
                  <div className="w-12 h-12 bg-cyan-100 rounded-full flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-cyan-600" />
                  </div>
                </div>
                <div className="flex items-center gap-1 text-sm">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  <span className="text-green-500 font-open-sans">+28.4%</span>
                </div>
              </CardContent>
            </Card>

            {/* Deals Won */}
            <Card>
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-sm text-gray-500 font-open-sans">Deals Won</p>
                    <div className="flex items-baseline gap-2">
                      <h3 className="text-2xl font-bold text-gray-900 font-open-sans">12</h3>
                      <span className="text-xs text-gray-500 font-open-sans">this month</span>
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                </div>
                <div className="flex items-center gap-1 text-sm">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  <span className="text-green-500 font-open-sans">+41.2%</span>
                </div>
              </CardContent>
            </Card>

            {/* Conversion Rate */}
            <Card>
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-sm text-gray-500 font-open-sans">Conversion Rate</p>
                    <div className="flex items-baseline gap-2">
                      <h3 className="text-2xl font-bold text-gray-900 font-open-sans">34.2%</h3>
                      <span className="text-xs text-gray-500 font-open-sans">vs last month</span>
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <BarChart3 className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
                <div className="flex items-center gap-1 text-sm">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  <span className="text-green-500 font-open-sans">+8.1%</span>
                </div>
              </CardContent>
            </Card>

            {/* Additional metric cards */}
            <Card>
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-sm text-gray-500 font-open-sans">Pipeline Value</p>
                    <h3 className="text-2xl font-bold text-gray-900 font-open-sans">£284k</h3>
                  </div>
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                    <BarChart3 className="w-6 h-6 text-red-600" />
                  </div>
                </div>
                <div className="flex items-center gap-1 text-sm">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  <span className="text-green-500 font-open-sans">+18.7%</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-sm text-gray-500 font-open-sans">Revenue Generated</p>
                    <div className="flex items-baseline gap-2">
                      <h3 className="text-2xl font-bold text-gray-900 font-open-sans">£187k</h3>
                      <span className="text-xs text-gray-500 font-open-sans">this month</span>
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-red-600" />
                  </div>
                </div>
                <div className="flex items-center gap-1 text-sm">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  <span className="text-green-500 font-open-sans">+29.8%</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-sm text-gray-500 font-open-sans">Time Saved</p>
                    <div className="flex items-baseline gap-2">
                      <h3 className="text-2xl font-bold text-gray-900 font-open-sans">164</h3>
                      <span className="text-xs text-gray-500 font-open-sans">hours this month</span>
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <Clock className="w-6 h-6 text-green-600" />
                  </div>
                </div>
                <div className="flex items-center gap-1 text-sm">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  <span className="text-green-500 font-open-sans">+35.2%</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-sm text-gray-500 font-open-sans">Customer Satisfaction</p>
                    <div className="flex items-baseline gap-2">
                      <h3 className="text-2xl font-bold text-gray-900 font-open-sans">4.8/5</h3>
                      <span className="text-xs text-gray-500 font-open-sans">avg rating</span>
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                    <Award className="w-6 h-6 text-yellow-600" />
                  </div>
                </div>
                <div className="flex items-center gap-1 text-sm">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  <span className="text-green-500 font-open-sans">+6.7%</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Dashboard Grid */}
          <div className="bg-purple-50 rounded-xl p-6 space-y-6">
            <div className="grid grid-cols-12 gap-6">
              {/* Tasks and Reminders Column */}
              <div className="col-span-7 space-y-6">
                {/* Priority Tasks */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-[17px] font-open-sans">Priority Tasks</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-start gap-4">
                      <div className="w-5 h-5 border-2 border-gray-400 rounded mt-1"></div>
                      <div className="flex-1">
                        <p className="font-open-sans text-black">Follow up on 3 qualified leads from yesterday</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className="bg-red-100 text-red-800 text-xs">high</Badge>
                          <span className="text-sm text-gray-500 font-open-sans">30 min</span>
                          <span className="text-sm text-gray-500 font-open-sans">• 9:00 AM</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mt-1">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-open-sans text-gray-500 line-through">Review and approve AI-generated proposals</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className="bg-purple-100 text-purple-800 text-xs">medium</Badge>
                          <span className="text-sm text-gray-500 font-open-sans">15 min</span>
                          <span className="text-sm text-gray-500 font-open-sans">• 11:00 AM</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-5 h-5 border-2 border-gray-400 rounded mt-1"></div>
                      <div className="flex-1">
                        <p className="font-open-sans text-black">Schedule site surveys for this week</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className="bg-red-100 text-red-800 text-xs">high</Badge>
                          <span className="text-sm text-gray-500 font-open-sans">20 min</span>
                          <span className="text-sm text-gray-500 font-open-sans">• 2:00 PM</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-5 h-5 border-2 border-gray-400 rounded mt-1"></div>
                      <div className="flex-1">
                        <p className="font-open-sans text-black">Send weekly solar insights to nurture list</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className="bg-purple-100 text-purple-800 text-xs">medium</Badge>
                          <span className="text-sm text-gray-500 font-open-sans">10 min</span>
                          <span className="text-sm text-gray-500 font-open-sans">• 4:00 PM</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Reminders Column */}
              <div className="col-span-5">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-[17px] font-open-sans">Reminders</CardTitle>
                    <Plus className="w-4 h-4 text-purple-600" />
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-gray-100 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                        <h4 className="font-open-sans font-medium">Team Standup Meeting</h4>
                      </div>
                      <p className="text-sm text-gray-600 font-open-sans mb-2">10:00 AM - 10:30 AM</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          <span className="font-open-sans">Conference Room A</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          <span className="font-open-sans">2 attendees</span>
                        </div>
                      </div>
                      <Button className="bg-squidgy-gradient text-white gap-2 text-xs px-4 py-2">
                        <Play className="w-4 h-4" />
                        Start Meeting
                      </Button>
                    </div>

                    <div className="bg-gray-100 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                        <h4 className="font-open-sans font-medium">Review AI Suggestions</h4>
                      </div>
                      <p className="text-sm text-gray-600 font-open-sans">Due in 2 hours</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Charts and Insights Row */}
            <div className="grid grid-cols-12 gap-6">
              {/* Weekly Sales Performance */}
              <div className="col-span-7">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-[17px] font-open-sans">Weekly Sales Performance</CardTitle>
                    <Button variant="ghost" className="text-purple-600 gap-1">
                      View Pipeline
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-3 mb-6">
                      <Button variant="outline" size="sm">Monthly</Button>
                      <Button size="sm" className="bg-purple-100 text-purple-700 hover:bg-purple-100">Weekly</Button>
                      <Button variant="outline" size="sm">Custom Dates</Button>
                    </div>
                    
                    <div className="h-72 flex items-center justify-center">
                      <img 
                        src="https://api.builder.io/api/v1/image/assets/TEMP/da246d08c5389d582108deb80b70b7914c657931?width=1336" 
                        alt="Sales Performance Chart" 
                        className="w-full h-full object-contain"
                      />
                    </div>
                    
                    <div className="flex items-center gap-6 mt-4">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                        <span className="text-sm text-gray-600 font-open-sans">New Leads</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>
                        <span className="text-sm text-gray-600 font-open-sans">Qualified</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                        <span className="text-sm text-gray-600 font-open-sans">Converted</span>
                      </div>
                    </div>
                    
                    <div className="bg-white rounded-lg p-4 mt-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Lightbulb className="w-5 h-5 text-purple-600" />
                        <h4 className="font-open-sans font-medium">Key Impact Areas</h4>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-gray-700 font-open-sans">24/7 lead response</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                          <span className="text-gray-700 font-open-sans">Automated qualification</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                          <span className="text-gray-700 font-open-sans">Higher conversion rates</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                          <span className="text-gray-700 font-open-sans">Improved satisfaction</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* AI Sales Insights */}
              <div className="col-span-5">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-[18px] font-open-sans">AI Sales Insights</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex gap-3">
                      <div className="w-9 h-9 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                        <Lightbulb className="w-5 h-5 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-open-sans font-medium">High-value prospect identified</h4>
                          <Badge className="bg-red-100 text-red-800 text-xs">High</Badge>
                        </div>
                        <p className="text-sm text-gray-600 font-open-sans mb-2">New enquiry from £50k+ property with optimal roof conditions</p>
                        <p className="text-sm text-purple-600 font-open-sans mb-2">Priority follow-up within 1 hour</p>
                        <p className="text-xs text-gray-500 font-open-sans mb-3">8 minutes ago</p>
                        <div className="flex gap-2">
                          <Button size="sm" className="bg-purple-100 text-purple-700 hover:bg-purple-100">
                            Approve
                          </Button>
                          <Button variant="outline" size="sm" className="gap-1">
                            <Eye className="w-4 h-4" />
                            Details
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <div className="w-9 h-9 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                        <Lightbulb className="w-5 h-5 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-open-sans font-medium">Government incentive deadline approaching</h4>
                          <Badge className="bg-purple-100 text-purple-800 text-xs">Medium</Badge>
                        </div>
                        <p className="text-sm text-gray-600 font-open-sans mb-2">15 prospects eligible for Smart Export Guarantee - deadline in 2 weeks</p>
                        <p className="text-sm text-purple-600 font-open-sans mb-2">Send targeted incentive campaign</p>
                        <p className="text-xs text-gray-500 font-open-sans mb-3">2 hours ago</p>
                        <div className="flex gap-2">
                          <Button size="sm" className="bg-purple-100 text-purple-700 hover:bg-purple-100">
                            Approve
                          </Button>
                          <Button variant="outline" size="sm" className="gap-1">
                            <Eye className="w-4 h-4" />
                            Details
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <div className="w-9 h-9 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                        <Lightbulb className="w-5 h-5 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-open-sans font-medium">Warm leads ready for follow-up</h4>
                          <Badge className="bg-purple-100 text-purple-800 text-xs">Medium</Badge>
                        </div>
                        <p className="text-sm text-gray-600 font-open-sans mb-2">7 prospects have viewed proposals multiple times but not responded</p>
                        <p className="text-sm text-purple-600 font-open-sans mb-2">Schedule gentle follow-up calls</p>
                        <p className="text-xs text-gray-500 font-open-sans mb-3">1 hour ago</p>
                        <div className="flex gap-2">
                          <Button size="sm" className="bg-purple-100 text-purple-700 hover:bg-purple-100">
                            Approve
                          </Button>
                          <Button variant="outline" size="sm" className="gap-1">
                            <Eye className="w-4 h-4" />
                            Details
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Recent Leads and Activity Row */}
            <div className="grid grid-cols-12 gap-6">
              {/* Recent High-Priority Leads */}
              <div className="col-span-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-[17px] font-open-sans">Recent High-Priority Leads</CardTitle>
                    <Button variant="ghost" className="text-purple-600 gap-1">
                      View All
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="border border-red-200 bg-red-50 rounded-lg p-4">
                      <div className="flex gap-3">
                        <div className="w-5 h-5 text-red-500 mt-1">
                          <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-open-sans font-medium">Sarah Johnson</h4>
                            <Badge className="bg-red-100 text-red-800 text-xs">Hot Lead</Badge>
                          </div>
                          <p className="text-sm text-gray-600 font-open-sans mb-2">4-bed detached, £500k property</p>
                          <p className="text-sm text-gray-700 font-open-sans mb-2">Optimal south-facing roof, high energy bills (£300/month), ready to proceed</p>
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <span className="font-open-sans">15 minutes ago</span>
                            <span>•</span>
                            <span className="font-open-sans">WhatsApp enquiry</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="border border-purple-200 bg-purple-50 rounded-lg p-4">
                      <div className="flex gap-3">
                        <div className="w-5 h-5 text-purple-500 mt-1">
                          <Users className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-open-sans font-medium">Mike Chen</h4>
                            <Badge className="bg-purple-100 text-purple-800 text-xs">Qualified</Badge>
                          </div>
                          <p className="text-sm text-gray-600 font-open-sans mb-2">New build property, eligible for grants</p>
                          <p className="text-sm text-gray-700 font-open-sans mb-2">Interested in 6kW system, requesting quote for Smart Export Guarantee</p>
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <span className="font-open-sans">1 hour ago</span>
                            <span>•</span>
                            <span className="font-open-sans">Website form</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="border border-gray-200 bg-white rounded-lg p-4">
                      <div className="flex gap-3">
                        <div className="w-5 h-5 text-gray-500 mt-1">
                          <Users className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-open-sans font-medium">Emma Wilson</h4>
                            <Badge className="bg-blue-100 text-blue-800 text-xs">Follow-up</Badge>
                          </div>
                          <p className="text-sm text-gray-600 font-open-sans mb-2">Considering battery storage addition</p>
                          <p className="text-sm text-gray-700 font-open-sans mb-2">Existing solar customer interested in battery upgrade, budget confirmed</p>
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <span className="font-open-sans">3 hours ago</span>
                            <span>•</span>
                            <span className="font-open-sans">Phone call</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* AI Assistant Activity */}
              <div className="col-span-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-[17px] font-open-sans">AI Assistant Activity</CardTitle>
                    <Badge className="bg-green-100 text-green-800">Active 24/7</Badge>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-3">
                      <div className="w-9 h-9 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <h4 className="font-open-sans font-medium mb-1">Qualified 3 new leads automatically</h4>
                        <p className="text-sm text-gray-600 font-open-sans mb-1">Assessed roof suitability and energy usage via WhatsApp conversations</p>
                        <p className="text-xs text-gray-500 font-open-sans">Just now</p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <MessageCircle className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-open-sans font-medium mb-1">Sent personalized energy reports to 12 prospects</h4>
                        <p className="text-sm text-gray-600 font-open-sans mb-1">Including ROI calculations and government incentive eligibility</p>
                        <p className="text-xs text-gray-500 font-open-sans">15 minutes ago</p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <div className="w-9 h-9 bg-cyan-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Calendar className="w-5 h-5 text-cyan-600" />
                      </div>
                      <div>
                        <h4 className="font-open-sans font-medium mb-1">Scheduled 4 site surveys for next week</h4>
                        <p className="text-sm text-gray-600 font-open-sans mb-1">Coordinated with customer availability and engineer schedules</p>
                        <p className="text-xs text-gray-500 font-open-sans">1 hour ago</p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <div className="w-9 h-9 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-red-600">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-open-sans font-medium mb-1">Identified high-value prospect requiring urgent follow-up</h4>
                        <p className="text-sm text-gray-600 font-open-sans mb-1">£50k+ property with optimal conditions, ready to proceed immediately</p>
                        <p className="text-xs text-gray-500 font-open-sans">2 hours ago</p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <div className="w-9 h-9 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Lightbulb className="w-5 h-5 text-yellow-600" />
                      </div>
                      <div>
                        <h4 className="font-open-sans font-medium mb-1">Generated Smart Export Guarantee campaign</h4>
                        <p className="text-sm text-gray-600 font-open-sans mb-1">Targeting 47 qualified prospects with deadline approaching</p>
                        <p className="text-xs text-gray-500 font-open-sans">3 hours ago</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-purple-50 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 bg-pink-500 rounded-full flex items-center justify-center">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-[18px] font-bold text-gray-900 font-open-sans">Quick Actions</h2>
                  <p className="text-[13px] text-gray-600 font-open-sans">Streamline your solar sales workflow</p>
                </div>
              </div>
              
              <div className="grid grid-cols-4 gap-6">
                <Button variant="outline" className="flex-col h-auto py-4 bg-purple-50 border-purple-200">
                  <div className="w-9 h-9 bg-purple-100 rounded-full flex items-center justify-center mb-2">
                    <Target className="w-5 h-5 text-purple-600" />
                  </div>
                  <span className="font-open-sans">View New Leads</span>
                </Button>
                
                <Button variant="outline" className="flex-col h-auto py-4 bg-purple-50 border-purple-200">
                  <div className="w-9 h-9 bg-red-100 rounded-full flex items-center justify-center mb-2">
                    <Calendar className="w-5 h-5 text-red-600" />
                  </div>
                  <span className="font-open-sans">Schedule Survey</span>
                </Button>
                
                <Button variant="outline" className="flex-col h-auto py-4 bg-purple-50 border-purple-200">
                  <div className="w-9 h-9 bg-green-100 rounded-full flex items-center justify-center mb-2">
                    <MessageCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <span className="font-open-sans">Start New Chat</span>
                </Button>
                
                <Button variant="outline" className="flex-col h-auto py-4 bg-purple-50 border-purple-200">
                  <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center mb-2">
                    <BarChart3 className="w-5 h-5 text-blue-600" />
                  </div>
                  <span className="font-open-sans">View Analytics</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
