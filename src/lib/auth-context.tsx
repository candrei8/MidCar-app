"use client"

import { createContext, useContext, useEffect, useState, ReactNode, useRef, useMemo, useCallback } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase, isSupabaseConfigured } from './supabase'

// Timeout para la inicialización de auth (1.5 segundos)
const AUTH_TIMEOUT_MS = 1500

interface UserProfile {
    id: string
    email: string
    nombre: string
    apellidos: string
    avatar_url: string | null
    rol: 'admin' | 'vendedor' | 'mecanico' | 'recepcionista'
    permisos: string[]
    activo: boolean
}

interface FullViewResult {
    success: boolean
    error?: string
    remainingAttempts?: number
    locked?: boolean
}

interface AuthContextType {
    user: User | null
    profile: UserProfile | null
    session: Session | null
    loading: boolean
    isFullView: boolean
    isConfigured: boolean // SECURITY: Expose configuration status
    signIn: (email: string, password: string) => Promise<{ error: Error | null }>
    signUp: (email: string, password: string, profileData: Partial<UserProfile>) => Promise<{ error: Error | null }>
    signOut: () => Promise<void>
    unlockFullView: (code: string) => Promise<FullViewResult>
    lockFullView: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [profile, setProfile] = useState<UserProfile | null>(null)
    const [session, setSession] = useState<Session | null>(null)
    const [loading, setLoading] = useState(true)
    const [isFullView, setIsFullView] = useState(false) // Vista personal por defecto - requiere contraseña para vista completa
    const authInitialized = useRef(false)

    // Fetch user profile from database with timeout
    const fetchProfile = async (userId: string): Promise<UserProfile | null> => {
        try {
            // If Supabase is not configured, skip profile fetch
            if (!isSupabaseConfigured) {
                return null
            }

            const timeoutPromise = new Promise<null>((resolve) =>
                setTimeout(() => {
                    // Resolve with null instead of rejecting to avoid console errors
                    resolve(null)
                }, AUTH_TIMEOUT_MS)
            )

            const fetchPromise = supabase
                .from('users')
                .select('*')
                .eq('id', userId)
                .single()
                .then(({ data, error }) => {
                    if (error) {
                        // Don't log error for missing profile - common case
                        return null
                    }
                    return data as UserProfile
                })

            return await Promise.race([fetchPromise, timeoutPromise])
        } catch {
            // Silent fail - return null
            return null
        }
    }

    useEffect(() => {
        // Prevent double initialization in React StrictMode
        if (authInitialized.current) return
        authInitialized.current = true

        // SECURITY: If auth service is not configured, set loading to false but DO NOT allow access
        // The AuthGuard and middleware will handle blocking access
        if (!isSupabaseConfigured) {
            console.error('SECURITY: Authentication service not configured.')
            setLoading(false)
            return
        }

        // onAuthStateChange is the single source of truth for auth state.
        // It fires immediately with the current session from the stored cookie,
        // which sets up the initial state and transitions loading → false.
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, newSession) => {
                setSession(newSession)
                setUser(newSession?.user ?? null)

                if (newSession?.user) {
                    const userProfile = await fetchProfile(newSession.user.id)
                    setProfile(userProfile)
                } else {
                    setProfile(null)
                    setIsFullView(false)
                }

                setLoading(false)
            }
        )

        // SECURITY: After the listener sets the initial state from the local cookie,
        // do a one-time server-side validation. If the token is expired/invalid,
        // silently sign the user out — the listener above will handle the state reset.
        // This avoids racing setState calls and the infinite re-render (React error #185).
        supabase.auth.getUser().then(({ error }) => {
            if (error) {
                // Token is invalid — sign out to clear stale cookies.
                // onAuthStateChange will fire with null session and redirect to login.
                supabase.auth.signOut()
            }
        })

        return () => {
            subscription.unsubscribe()
        }

    }, [])

    const signIn = useCallback(async (email: string, password: string) => {
        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            })
            return { error: error as Error | null }
        } catch (err) {
            return { error: err as Error }
        }
    }, [])

    const signUp = useCallback(async (email: string, password: string, profileData: Partial<UserProfile>) => {
        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
            })

            if (error) {
                return { error: new Error(error.message) }
            }

            if (!data.user) {
                return { error: new Error('No se pudo crear el usuario') }
            }

            // Create user profile
            await supabase
                .from('users')
                .insert({
                    id: data.user.id,
                    email: data.user.email,
                    nombre: profileData.nombre || '',
                    apellidos: profileData.apellidos || '',
                    rol: profileData.rol || 'vendedor',
                    permisos: profileData.permisos || [],
                    activo: true,
                    fecha_alta: new Date().toISOString(),
                })

            // Auto login after signup
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email,
                password,
            })

            if (signInError) {
                return { error: new Error(signInError.message) }
            }

            return { error: null }
        } catch (err) {
            return { error: err as Error }
        }
    }, [])

    const signOut = useCallback(async () => {
        setIsFullView(false) // Resetear a vista personal al cerrar sesión
        await supabase.auth.signOut()
    }, [])

    // Verificar código de acceso para vista completa
    const unlockFullView = useCallback(async (code: string): Promise<FullViewResult> => {
        try {
            const response = await fetch('/api/auth/verify-fullview', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ code }),
            })

            const result = await response.json()

            if (result.success) {
                setIsFullView(true)
                return { success: true }
            } else {
                return {
                    success: false,
                    error: result.error || 'Código incorrecto',
                    remainingAttempts: result.remainingAttempts,
                    locked: result.locked,
                }
            }
        } catch (error) {
            console.error('Error verifying full view code:', error)
            return { success: false, error: 'Error de conexión' }
        }
    }, [])

    const lockFullView = useCallback(() => {
        setIsFullView(false)
    }, [])

    // Memoizar el valor del contexto para evitar re-renders innecesarios
    const contextValue = useMemo(() => ({
        user,
        profile,
        session,
        loading,
        isFullView,
        isConfigured: isSupabaseConfigured,
        signIn,
        signUp,
        signOut,
        unlockFullView,
        lockFullView,
    }), [user, profile, session, loading, isFullView, signIn, signUp, signOut, unlockFullView, lockFullView])

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}
