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

        // Get initial session - use getUser() to validate against Supabase server
        // SECURITY: getSession() only reads from local cache and does NOT validate the token.
        // A stale/expired cookie would bypass the auth check and show the dashboard with
        // a generic "Usuario" profile. getUser() sends the token to Supabase's server for
        // real validation, so expired sessions are correctly rejected.
        const initAuth = async () => {
            try {
                const { data: { user: currentUser }, error } = await supabase.auth.getUser()

                if (error) {
                    // Token is invalid or expired - clear state and force re-login
                    setUser(null)
                    setSession(null)
                    setProfile(null)
                    return
                }

                if (currentUser) {
                    // Also grab session for token refresh purposes
                    const { data: { session: currentSession } } = await supabase.auth.getSession()
                    setSession(currentSession)
                    setUser(currentUser)
                    // Profile fetch has timeout since it's a network request
                    const userProfile = await fetchProfile(currentUser.id)
                    setProfile(userProfile)
                } else {
                    setUser(null)
                    setSession(null)
                }
            } catch (error) {
                console.error('Error initializing auth:', error)
                setUser(null)
                setSession(null)
            } finally {
                setLoading(false)
            }
        }

        initAuth()

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, newSession) => {
                setSession(newSession)
                setUser(newSession?.user ?? null)

                if (newSession?.user) {
                    const userProfile = await fetchProfile(newSession.user.id)
                    setProfile(userProfile)
                } else {
                    setProfile(null)
                    setIsFullView(false) // Resetear a vista personal al cerrar sesión
                }

                setLoading(false)
            }
        )

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
