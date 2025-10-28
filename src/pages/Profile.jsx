import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { ArrowLeft, Save, Globe, User as UserIcon, Mail, Calendar } from 'lucide-react'
import { supabase, getCurrentUser } from '@/lib/supabase'

const Profile = () => {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    website_url: ''
  })

  useEffect(() => {
    loadUserProfile()
  }, [])

  const loadUserProfile = async () => {
    try {
      const currentUser = await getCurrentUser()
      if (!currentUser) {
        navigate('/login')
        return
      }

      // Get user profile data
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single()

      if (error) {
        console.error('Error loading profile:', error)
        toast.error('Failed to load profile')
        return
      }

      setUser(profile)
      setFormData({
        full_name: profile.full_name || '',
        email: profile.email || currentUser.email || '',
        website_url: profile.website_url || ''
      })
    } catch (error) {
      console.error('Error loading profile:', error)
      toast.error('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!user) return

    setSaving(true)
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          full_name: formData.full_name,
          website_url: formData.website_url,
          updated_date: new Date().toISOString()
        })
        .eq('id', user.id)

      if (error) {
        console.error('Error updating profile:', error)
        toast.error('Failed to update profile')
        return
      }

      toast.success('Profile updated successfully!')
      
      // Reload profile data
      await loadUserProfile()
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <UserIcon className="w-6 h-6 text-blue-600" />
              </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
              <p className="text-gray-600">Manage your account information and preferences</p>
            </div>
          </div>
        </div>

        <div className="grid gap-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserIcon className="w-5 h-5" />
                Basic Information
              </CardTitle>
              <CardDescription>
                Update your personal details and contact information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="full_name">Full Name</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => handleInputChange('full_name', e.target.value)}
                  placeholder="Enter your full name"
                />
              </div>
              
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  disabled
                  className="bg-gray-50"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Email cannot be changed. Contact support if you need to update it.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Website Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Website Settings
              </CardTitle>
              <CardDescription>
                Add your website URL to enable internal linking and Flash AI features
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="website_url">Website URL</Label>
                <Input
                  id="website_url"
                  type="url"
                  value={formData.website_url}
                  onChange={(e) => handleInputChange('website_url', e.target.value)}
                  placeholder="https://yourwebsite.com"
                />
                <p className="text-sm text-gray-500 mt-1">
                  This URL will be used for internal linking in your Flash AI enhanced content.
                  Make sure to include the full URL including https://
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Account Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Account Information
              </CardTitle>
              <CardDescription>
                Your account details and membership information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Account Type</Label>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium">{user.role || 'User'}</span>
                  </div>
                </div>
                <div>
                  <Label>Account Balance</Label>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium">
                      {user.account_balance !== undefined && user.account_balance !== null 
                        ? `$${parseFloat(user.account_balance).toFixed(2)}`
                        : '$5.00'
                      }
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Member Since</Label>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium">
                      {user.created_date ? new Date(user.created_date).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                </div>
                <div>
                  <Label>Last Updated</Label>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium">
                      {user.updated_date ? new Date(user.updated_date).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="px-8"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Profile
