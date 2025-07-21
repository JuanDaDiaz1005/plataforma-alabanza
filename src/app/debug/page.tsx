'use client'

import { useSession } from 'next-auth/react'
import Layout from '@/components/Layout'

export default function DebugPage() {
  const { data: session, status } = useSession()

  return (
    <Layout titulo="Debug Sesión">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Debug de Sesión</h1>
        
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Estado de la Sesión</h2>
          
          <div className="space-y-4 text-gray-900">
            <div>
              <strong className="text-gray-700">Status:</strong> <span className="font-mono text-blue-600">{status}</span>
            </div>
            
            {session ? (
              <>
                <div>
                  <strong className="text-gray-700">Usuario ID:</strong> <span className="font-mono text-gray-900">{session.user?.id}</span>
                </div>
                <div>
                  <strong className="text-gray-700">Email:</strong> <span className="font-mono text-gray-900">{session.user?.email}</span>
                </div>
                <div>
                  <strong className="text-gray-700">Nombre:</strong> <span className="font-mono text-gray-900">{session.user?.name}</span>
                </div>
                <div>
                  <strong className="text-gray-700">Rol:</strong> <span className="font-mono bg-yellow-100 text-yellow-800 px-2 py-1 rounded">{session.user?.role}</span>
                </div>
                
                <div className="mt-6">
                  <h3 className="font-semibold text-gray-900 mb-2">Sesión Completa (JSON):</h3>
                  <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto text-gray-900">
                    {JSON.stringify(session, null, 2)}
                  </pre>
                </div>
                
                <div className="mt-6">
                  <h3 className="font-semibold text-gray-900 mb-2">Verificación de Permisos:</h3>
                  <div className="space-y-2">
                    <div>
                      <strong className="text-gray-700">¿Es ADMINISTRADOR?:</strong> 
                      <span className={`ml-2 px-2 py-1 rounded text-sm ${
                        session.user?.role === 'ADMINISTRADOR' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {session.user?.role === 'ADMINISTRADOR' ? 'SÍ' : 'NO'}
                      </span>
                    </div>
                    <div>
                      <strong className="text-gray-700">¿Es LIDER_ALABANZA?:</strong> 
                      <span className={`ml-2 px-2 py-1 rounded text-sm ${
                        session.user?.role === 'LIDER_ALABANZA' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {session.user?.role === 'LIDER_ALABANZA' ? 'SÍ' : 'NO'}
                      </span>
                    </div>
                    <div>
                      <strong className="text-gray-700">¿Puede crear canciones?:</strong> 
                      <span className={`ml-2 px-2 py-1 rounded text-sm ${
                        ['ADMINISTRADOR', 'LIDER_ALABANZA'].includes(session.user?.role || '') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {['ADMINISTRADOR', 'LIDER_ALABANZA'].includes(session.user?.role || '') ? 'SÍ' : 'NO'}
                      </span>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-red-600">
                No hay sesión activa
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
} 