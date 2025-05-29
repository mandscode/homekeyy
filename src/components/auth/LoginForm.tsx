"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { loginSchema, LoginFormValues, recoverPasswordSchema, recoverPasswordValues } from "@/lib/validation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Loader2, Lock, Mail, Phone } from "lucide-react"
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

  const router = useRouter() // 👈 initialize router
  
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  })

  const {
    register:registerRecover,
    handleSubmit:handleRecoverSubmit,
    setError:setRecoverError,
    formState: { errors:recoverErrors },
  } = useForm({
    resolver: zodResolver(recoverPasswordSchema),
  });

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
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Login failed";

      toast({
        title: message,
        description: "Please try again"
      })
      setError("password", {
        type: "manual",
        message: message,
      })
    } finally {
      // setLoading(false)
    }
  }

  const onRecoverSubmit = async (data: recoverPasswordValues) => {
    setLoading(true)
    try {
      const payload = {...data};
      if (!payload.email) {
        delete payload.email;
      }
      
      const response = await api.post(apiEndpoints.Auth.endpoints.recoverPassword.path, payload)
      if(response.status == 1) {
        setForgotPassDialog(false)
        toast({
          title: response.data.message
        });
      }
    } catch (err: unknown) {
      let message = "Login failed";
      if (err instanceof Error) {
        message = err.message;
      }

      setRecoverError("password", {
        type: "manual",
        message: message,
      })
      console.error("Login failed", err)
    } finally {
      setLoading(false)
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
      <Dialog open={isForgotPassDialog} onOpenChange={setForgotPassDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Recover Password</DialogTitle>
          </DialogHeader>

          {/* The form wrapper */}
          <form onSubmit={handleRecoverSubmit((data) => {
            onRecoverSubmit(data);
          })} className="space-y-4 w-full">
            {/* Phone */}
            <div className="relative">
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input className="pl-9" {...registerRecover("phone")} placeholder="Phone" />
              </div>
              {recoverErrors.phone && <p className="text-sm text-red-500">{recoverErrors.phone.message}</p>}
            </div>

            {/* Email */}
            <div className="relative mt-2">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input {...registerRecover("email")} placeholder="Email (optional)" className="pl-9" />
              </div>
            </div>

            {/* Name */}
            <div className="relative mt-2">
              <Input {...registerRecover("name")} placeholder="Full Name" />
              {recoverErrors.name && <p className="text-sm text-red-500">{recoverErrors.name.message}</p>}
            </div>

            {/* New Password */}
            <div className="relative mt-2">
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-9"
                  type="password"
                  {...registerRecover("password")}
                  placeholder="New Password"
                  />
              </div>
              {recoverErrors.password && (
                <p className="text-sm text-red-500">{recoverErrors.password.message}</p>
              )}
            </div>

            {/* Submit */}
            <Button type="submit" className="mt-4 w-full">
              Submit
            </Button>
          </form>
        </DialogContent>
      </Dialog>

  </>
  )
}