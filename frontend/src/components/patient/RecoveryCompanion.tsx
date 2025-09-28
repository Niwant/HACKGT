'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { 
  Calendar, 
  CheckCircle, 
  Clock, 
  Target, 
  TrendingUp, 
  AlertTriangle,
  Heart,
  Activity,
  BookOpen,
  Utensils,
  Pill,
  Stethoscope
} from 'lucide-react'
import { RecoveryMilestone, RehabChecklist } from '@/types'
import { format, isAfter, isBefore, differenceInDays } from 'date-fns'

interface RecoveryCompanionProps {
  milestones: RecoveryMilestone[]
  checklist: RehabChecklist[]
  onUpdateMilestone: (milestone: RecoveryMilestone) => void
  onUpdateChecklist: (item: RehabChecklist) => void
}

export function RecoveryCompanion({ milestones, checklist, onUpdateMilestone, onUpdateChecklist }: RecoveryCompanionProps) {
  const [activeTab, setActiveTab] = useState<'timeline' | 'checklist' | 'education' | 'lifestyle'>('timeline')

  const completedMilestones = milestones.filter(m => m.isCompleted).length
  const totalMilestones = milestones.length
  const completedChecklist = checklist.filter(c => c.isCompleted).length
  const totalChecklist = checklist.length

  const getMilestoneStatus = (milestone: RecoveryMilestone) => {
    const now = new Date()
    if (milestone.isCompleted) return 'completed'
    if (isAfter(now, milestone.targetDate)) return 'overdue'
    if (isBefore(now, milestone.targetDate)) return 'upcoming'
    return 'due'
  }

  const getMilestoneColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-50 border-green-200'
      case 'overdue': return 'text-red-600 bg-red-50 border-red-200'
      case 'due': return 'text-blue-600 bg-blue-50 border-blue-200'
      case 'upcoming': return 'text-gray-600 bg-gray-50 border-gray-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'lab': return <Stethoscope className="w-4 h-4" />
      case 'exercise': return <Activity className="w-4 h-4" />
      case 'medication': return <Pill className="w-4 h-4" />
      case 'lifestyle': return <Heart className="w-4 h-4" />
      default: return <Target className="w-4 h-4" />
    }
  }

  const getChecklistCategoryIcon = (category: string) => {
    switch (category) {
      case 'diet': return <Utensils className="w-4 h-4" />
      case 'exercise': return <Activity className="w-4 h-4" />
      case 'medication': return <Pill className="w-4 h-4" />
      case 'monitoring': return <Stethoscope className="w-4 h-4" />
      default: return <CheckCircle className="w-4 h-4" />
    }
  }

  // Load education and lifestyle data from centralized source
  const [educationContent, setEducationContent] = useState<any[]>([])
  const [lifestyleTips, setLifestyleTips] = useState<any[]>([])

  useEffect(() => {
    const loadContent = async () => {
      const { getEducationContent, getLifestyleTips } = await import('@/lib/mockData')
      
      const education = await getEducationContent()
      const lifestyle = await getLifestyleTips()
      
      // Add icons to lifestyle tips
      const lifestyleWithIcons = lifestyle.map((category: any, index: number) => ({
        ...category,
        icon: index === 0 ? <Utensils className="w-5 h-5" /> :
              index === 1 ? <Activity className="w-5 h-5" /> :
              <Stethoscope className="w-5 h-5" />
      }))
      
      setEducationContent(education)
      setLifestyleTips(lifestyleWithIcons)
    }
    
    loadContent()
  }, [])

  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recovery Progress</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0}%
            </div>
            <Progress 
              value={totalMilestones > 0 ? (completedMilestones / totalMilestones) * 100 : 0} 
              className="mt-2" 
            />
            <p className="text-xs text-muted-foreground mt-2">
              {completedMilestones} of {totalMilestones} milestones completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Daily Tasks</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {completedChecklist}/{totalChecklist}
            </div>
            <Progress 
              value={totalChecklist > 0 ? (completedChecklist / totalChecklist) * 100 : 0} 
              className="mt-2" 
            />
            <p className="text-xs text-muted-foreground mt-2">
              Tasks completed today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Streak</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">7 days</div>
            <p className="text-xs text-muted-foreground">
              Consecutive days of completing daily tasks
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="timeline">Recovery Timeline</TabsTrigger>
          <TabsTrigger value="checklist">Daily Checklist</TabsTrigger>
          <TabsTrigger value="education">Education</TabsTrigger>
          <TabsTrigger value="lifestyle">Lifestyle Tips</TabsTrigger>
        </TabsList>

        {/* Recovery Timeline Tab */}
        <TabsContent value="timeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Your Recovery Journey</CardTitle>
              <CardDescription>
                Track your progress through important health milestones
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {milestones.map((milestone) => {
                  const status = getMilestoneStatus(milestone)
                  const daysUntil = differenceInDays(milestone.targetDate, new Date())
                  
                  return (
                    <div
                      key={milestone.id}
                      className={`p-4 border rounded-lg ${getMilestoneColor(status)}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                          <div className="mt-1">
                            {milestone.isCompleted ? (
                              <CheckCircle className="w-5 h-5 text-green-600" />
                            ) : (
                              getCategoryIcon(milestone.category)
                            )}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg">{milestone.title}</h3>
                            <p className="text-gray-600 mt-1">{milestone.description}</p>
                            <div className="flex items-center space-x-4 mt-2 text-sm">
                              <span className="flex items-center space-x-1">
                                <Calendar className="w-4 h-4" />
                                <span>
                                  Target: {format(milestone.targetDate, 'MMM dd, yyyy')}
                                </span>
                              </span>
                              {milestone.completedDate && (
                                <span className="text-green-600">
                                  Completed: {format(milestone.completedDate, 'MMM dd, yyyy')}
                                </span>
                              )}
                              {!milestone.isCompleted && status === 'due' && (
                                <Badge variant="destructive">Due Today</Badge>
                              )}
                              {!milestone.isCompleted && status === 'overdue' && (
                                <Badge variant="destructive">Overdue</Badge>
                              )}
                              {!milestone.isCompleted && status === 'upcoming' && daysUntil > 0 && (
                                <Badge variant="outline">{daysUntil} days left</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        {!milestone.isCompleted && (
                          <Button
                            size="sm"
                            onClick={() => onUpdateMilestone({
                              ...milestone,
                              isCompleted: true,
                              completedDate: new Date()
                            })}
                          >
                            Mark Complete
                          </Button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Daily Checklist Tab */}
        <TabsContent value="checklist" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Today's Health Tasks</CardTitle>
              <CardDescription>
                Complete these daily activities to stay on track with your health goals
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {checklist.map((item) => (
                  <div
                    key={item.id}
                    className={`p-4 border rounded-lg ${
                      item.isCompleted ? 'bg-green-50 border-green-200' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <div className="mt-1">
                          {item.isCompleted ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          ) : (
                            getChecklistCategoryIcon(item.category)
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold">{item.title}</h3>
                          <p className="text-gray-600 text-sm mt-1">{item.description}</p>
                          <Badge variant="outline" className="mt-2 text-xs">
                            {item.category}
                          </Badge>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onUpdateChecklist({
                          ...item,
                          isCompleted: !item.isCompleted,
                          completedDate: !item.isCompleted ? new Date() : undefined
                        })}
                      >
                        {item.isCompleted ? 'Undo' : 'Complete'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Education Tab */}
        <TabsContent value="education" className="space-y-4">
          <div className="space-y-6">
            {educationContent.map((section, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BookOpen className="w-5 h-5" />
                    <span>{section.title}</span>
                  </CardTitle>
                  <CardDescription>{section.content}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3">
                    {section.articles.map((article: any, articleIndex: number) => (
                      <div
                        key={articleIndex}
                        className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                      >
                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                        <span className="text-sm">{article}</span>
                        <Button variant="ghost" size="sm" className="ml-auto">
                          Read
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Lifestyle Tips Tab */}
        <TabsContent value="lifestyle" className="space-y-4">
          <div className="grid gap-6">
            {lifestyleTips.map((category, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    {category.icon}
                    <span>{category.category}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {category.tips.map((tip: any, tipIndex: number) => (
                      <div key={tipIndex} className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-green-600 rounded-full mt-2"></div>
                        <span className="text-sm text-gray-700">{tip}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
