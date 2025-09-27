'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  Phone,
  Video,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  AlertTriangle
} from 'lucide-react'
import { format, addDays, isAfter, isBefore } from 'date-fns'

interface Appointment {
  id: string
  date: Date
  time: string
  type: 'in-person' | 'video' | 'phone'
  physician: string
  specialty: string
  location?: string
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled'
  notes?: string
  duration: number // in minutes
}

interface AppointmentSchedulerProps {
  appointments: Appointment[]
  onScheduleAppointment: (appointment: Omit<Appointment, 'id'>) => void
  onUpdateAppointment: (id: string, appointment: Partial<Appointment>) => void
  onCancelAppointment: (id: string) => void
}

export function AppointmentScheduler({ 
  appointments, 
  onScheduleAppointment, 
  onUpdateAppointment, 
  onCancelAppointment 
}: AppointmentSchedulerProps) {
  const [isNewAppointmentOpen, setIsNewAppointmentOpen] = useState(false)
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null)
  const [formData, setFormData] = useState({
    date: '',
    time: '',
    type: 'in-person' as Appointment['type'],
    physician: '',
    specialty: '',
    location: '',
    notes: '',
    duration: 30
  })

  const upcomingAppointments = appointments
    .filter(apt => apt.status !== 'cancelled' && apt.status !== 'completed')
    .sort((a, b) => a.date.getTime() - b.date.getTime())

  const pastAppointments = appointments
    .filter(apt => apt.status === 'completed')
    .sort((a, b) => b.date.getTime() - a.date.getTime())

  const getStatusColor = (status: Appointment['status']) => {
    switch (status) {
      case 'scheduled': return 'text-blue-600 bg-blue-50 border-blue-200'
      case 'confirmed': return 'text-green-600 bg-green-50 border-green-200'
      case 'completed': return 'text-gray-600 bg-gray-50 border-gray-200'
      case 'cancelled': return 'text-red-600 bg-red-50 border-red-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getStatusIcon = (status: Appointment['status']) => {
    switch (status) {
      case 'scheduled': return <Calendar className="w-4 h-4" />
      case 'confirmed': return <CheckCircle className="w-4 h-4" />
      case 'completed': return <CheckCircle className="w-4 h-4" />
      case 'cancelled': return <AlertTriangle className="w-4 h-4" />
      default: return <Calendar className="w-4 h-4" />
    }
  }

  const getTypeIcon = (type: Appointment['type']) => {
    switch (type) {
      case 'in-person': return <MapPin className="w-4 h-4" />
      case 'video': return <Video className="w-4 h-4" />
      case 'phone': return <Phone className="w-4 h-4" />
      default: return <Calendar className="w-4 h-4" />
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const appointment: Omit<Appointment, 'id'> = {
      date: new Date(formData.date),
      time: formData.time,
      type: formData.type,
      physician: formData.physician,
      specialty: formData.specialty,
      location: formData.location || undefined,
      status: 'scheduled',
      notes: formData.notes || undefined,
      duration: formData.duration
    }

    if (editingAppointment) {
      onUpdateAppointment(editingAppointment.id, appointment)
    } else {
      onScheduleAppointment(appointment)
    }

    setIsNewAppointmentOpen(false)
    setEditingAppointment(null)
    resetForm()
  }

  const resetForm = () => {
    setFormData({
      date: '',
      time: '',
      type: 'in-person',
      physician: '',
      specialty: '',
      location: '',
      notes: '',
      duration: 30
    })
  }

  const handleEdit = (appointment: Appointment) => {
    setFormData({
      date: format(appointment.date, 'yyyy-MM-dd'),
      time: appointment.time,
      type: appointment.type,
      physician: appointment.physician,
      specialty: appointment.specialty,
      location: appointment.location || '',
      notes: appointment.notes || '',
      duration: appointment.duration
    })
    setEditingAppointment(appointment)
    setIsNewAppointmentOpen(true)
  }

  const handleCancel = (id: string) => {
    onCancelAppointment(id)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Appointments</h2>
          <p className="text-gray-600">Manage your upcoming and past appointments</p>
        </div>
        <Button onClick={() => setIsNewAppointmentOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Schedule Appointment
        </Button>
      </div>

      {/* Upcoming Appointments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="w-5 h-5" />
            <span>Upcoming Appointments</span>
          </CardTitle>
          <CardDescription>
            Your scheduled and confirmed appointments
          </CardDescription>
        </CardHeader>
        <CardContent>
          {upcomingAppointments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No upcoming appointments</p>
              <p className="text-sm">Schedule an appointment to get started</p>
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className={`p-4 border rounded-lg ${getStatusColor(appointment.status)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <div className="mt-1">
                        {getStatusIcon(appointment.status)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="font-semibold text-lg">{appointment.physician}</h3>
                          <Badge variant="outline">{appointment.specialty}</Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 mb-3">
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4 text-gray-500" />
                            <span className="text-sm">{format(appointment.date, 'MMM dd, yyyy')}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Clock className="w-4 h-4 text-gray-500" />
                            <span className="text-sm">{appointment.time}</span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-4 mb-2">
                          <div className="flex items-center space-x-1">
                            {getTypeIcon(appointment.type)}
                            <span className="text-sm capitalize">{appointment.type.replace('-', ' ')}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="w-4 h-4 text-gray-500" />
                            <span className="text-sm">{appointment.duration} minutes</span>
                          </div>
                        </div>

                        {appointment.location && (
                          <div className="flex items-center space-x-2 mb-2">
                            <MapPin className="w-4 h-4 text-gray-500" />
                            <span className="text-sm">{appointment.location}</span>
                          </div>
                        )}

                        {appointment.notes && (
                          <p className="text-sm text-gray-600 mt-2">{appointment.notes}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(appointment)}
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleCancel(appointment.id)}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Past Appointments */}
      {pastAppointments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5" />
              <span>Past Appointments</span>
            </CardTitle>
            <CardDescription>
              Your completed appointments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pastAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="p-4 border rounded-lg bg-gray-50"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <div className="mt-1">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="font-semibold text-lg">{appointment.physician}</h3>
                          <Badge variant="outline">{appointment.specialty}</Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4 text-gray-500" />
                            <span className="text-sm">{format(appointment.date, 'MMM dd, yyyy')}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Clock className="w-4 h-4 text-gray-500" />
                            <span className="text-sm">{appointment.time}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* New/Edit Appointment Modal */}
      <Dialog open={isNewAppointmentOpen} onOpenChange={setIsNewAppointmentOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingAppointment ? 'Edit Appointment' : 'Schedule New Appointment'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  min={format(new Date(), 'yyyy-MM-dd')}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="time">Time</Label>
                <Input
                  id="time"
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Appointment Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: Appointment['type']) => setFormData(prev => ({ ...prev, type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in-person">In-Person</SelectItem>
                    <SelectItem value="video">Video Call</SelectItem>
                    <SelectItem value="phone">Phone Call</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Select
                  value={formData.duration.toString()}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, duration: parseInt(value) }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="45">45 minutes</SelectItem>
                    <SelectItem value="60">60 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="physician">Physician</Label>
                <Input
                  id="physician"
                  value={formData.physician}
                  onChange={(e) => setFormData(prev => ({ ...prev, physician: e.target.value }))}
                  placeholder="Dr. Smith"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="specialty">Specialty</Label>
                <Input
                  id="specialty"
                  value={formData.specialty}
                  onChange={(e) => setFormData(prev => ({ ...prev, specialty: e.target.value }))}
                  placeholder="Cardiology"
                  required
                />
              </div>
            </div>

            {formData.type === 'in-person' && (
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="123 Main St, City, State"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Any specific concerns or questions..."
                rows={3}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsNewAppointmentOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {editingAppointment ? 'Update Appointment' : 'Schedule Appointment'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
