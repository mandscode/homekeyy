"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { loginSchema, LoginFormValues } from "@/lib/validation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Loader2, Lock, Phone } from "lucide-react"
import { useEffect, useState } from "react"
import api from "@/lib/axios"
import { useRouter } from "next/navigation" // 👈 import router
import Cookies from "js-cookie"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import apiEndpoints from "@/lib/apiEndpoints"
import FullScreenLoader from "../utils/FullScreenLoader"

export default function LoginForm() {
  const [loading, setLoading] = useState(false)
  
  const { toast } = useToast()

  const [showDialog, setShowDialog] = useState(false)
  const [isForgotPassDialog, setForgotPassDialog] = useState(false)
  const [newPassword, setNewPassword] = useState("")
  const [userId, setUserId] = useState<string | null>(null)
  const [otpStep, setOtpStep] = useState<'phone' | 'otp' | 'password'>('phone')
  const [otpToken, setOtpToken] = useState<string | null>(null)
  const [phoneNumber, setPhoneNumber] = useState("")
  const [otp, setOtp] = useState("")

  const router = useRouter() // 👈 initialize router
  
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  })

  useEffect(() => {
    const token = Cookies.get('token')
    if (token) {
      router.push('/dashboard')
    }
  }, [router])
  

  const onSubmit = async (data: LoginFormValues) => {
    setLoading(true)
    try {
      const response = await api.post(apiEndpoints["Auth"].endpoints.login.path, data)
      const { token, isFirstLogin } = response.data
      
      if (isFirstLogin) {
        setUserId(data.phone)
        Cookies.set("tempToken", token, { expires: 1 })
        setLoading(false)
        setShowDialog(true)
      } else {
        toast({
          title: "Login successful",
          description: "You are now logged in"
        })
        Cookies.set('token', response.data.token, {
          path: '/',         // ensure it's available to all routes
          sameSite: 'strict',
          secure: false,     // set to `true` in production (https)
          expires: 1         // 1 day
        })
        router.push("/dashboard")
      }
      setLoading(false)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Login failed";
      setLoading(false)
      toast({
        title: message,
        description: "Please try again"
      })
      setError("password", {
        type: "manual",
        message: message,
      })
    } 
  }
  
  const handleChangePassword = async () => {
    setLoading(true)
    try {
      
      const token = Cookies.get('tempToken');
      
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      await api.put(apiEndpoints.Auth.endpoints.changePassword.path, { phone:userId, password:newPassword, isFirstLogin:false }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      
      const response = await api.post(apiEndpoints.Auth.endpoints.login.path, { phone: userId, password: newPassword })
      Cookies.set('token', response.data.token, {
        path: '/',         // ensure it's available to all routes
        sameSite: 'strict',
        secure: false,     // set to `true` in production (https)
        expires: 1         // 1 day
      })
      setShowDialog(false)
      router.push("/dashboard")
    } catch (error) {
      console.error("Password change failed", error)
      setLoading(false)
    }
  }

  const handleSendOtp = async () => {
    setLoading(true)
    try {
      const response = await api.post('/app/auth/send-otp', {
        phone: phoneNumber
      })
      if (response.status == 1) {
        setOtpStep('otp')
        toast({
          title: "OTP Sent",
          description: "Please check your phone for the OTP"
        })
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to send OTP"
      toast({
        title: "Error",
        description: message
      })
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async () => {
    setLoading(true)
    try {
      const response = await api.post('/app/auth/verify-otp', {
        phone: phoneNumber,
        otp: otp
      })
      if (response.data?.token) {
        setOtpToken(response.data.token)
        setOtpStep('password')
        toast({
          title: "OTP Verified",
          description: "Please set your new password"
        })
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to verify OTP"
      toast({
        title: "Error",
        description: message
      })
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async () => {
    setLoading(true)
    try {
      const response = await api.post('/app/auth/reset-password', 
        { newPassword },
        {
          headers: {
            Authorization: `Bearer ${otpToken}`
          }
        }
      )
      if (response.status == 1) {
        setForgotPassDialog(false)
        setOtpStep('phone')
        setPhoneNumber("")
        setOtp("")
        setNewPassword("")
        setOtpToken(null)
        toast({
          title: "Success",
          description: "Password has been reset successfully"
        })
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to reset password"
      toast({
        title: "Error",
        description: message
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {loading && <FullScreenLoader />}
      <Toaster />
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-sm w-full">
        <div className="relative">
          <div className="relative">
              <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input className="pl-9" {...register("phone")} placeholder="Phone" />
          </div>
          {errors.phone && <p className="text-sm text-red-500">{errors.phone.message}</p>}
        </div>
        <div className="relative">
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" type="password" {...register("password")} placeholder="Password" />
          </div>
          {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
        </div>
        <Button type="submit" disabled={loading} className="w-full">
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Logging in...
          </>
        ) : (
          "Login"
        )}
        </Button>
        <Button variant="ghost" type="button" className="w-full text-sm" onClick={() => setForgotPassDialog(true)}>
          Forgot your password?
        </Button>
      </form>
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
          </DialogHeader>
          <Input
            type="password"
            placeholder="Enter new password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="mt-2"
          />
          <Button onClick={handleChangePassword} className="mt-4 w-full">
            Submit
          </Button>
        </DialogContent>
      </Dialog>
      <Dialog open={isForgotPassDialog} onOpenChange={(open) => {
        setForgotPassDialog(open)
        if (!open) {
          setOtpStep('phone')
          setPhoneNumber("")
          setOtp("")
          setNewPassword("")
          setOtpToken(null)
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
          </DialogHeader>

          {otpStep === 'phone' && (
            <div className="space-y-4">
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input 
                  className="pl-9" 
                  placeholder="Enter your phone number"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                />
              </div>
              <Button 
                onClick={handleSendOtp} 
                className="w-full"
                disabled={!phoneNumber || loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending OTP...
                  </>
                ) : (
                  "Send OTP"
                )}
              </Button>
            </div>
          )}

          {otpStep === 'otp' && (
            <div className="space-y-4">
              <div className="relative">
                <Input 
                  placeholder="Enter OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                />
              </div>
              <Button 
                onClick={handleVerifyOtp} 
                className="w-full"
                disabled={!otp || loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Verify OTP"
                )}
              </Button>
            </div>
          )}

          {otpStep === 'password' && (
            <div className="space-y-4">
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input 
                  className="pl-9"
                  type="password"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <Button 
                onClick={handleResetPassword} 
                className="w-full"
                disabled={!newPassword || loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Resetting...
                  </>
                ) : (
                  "Reset Password"
                )}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

  </>
  )
}