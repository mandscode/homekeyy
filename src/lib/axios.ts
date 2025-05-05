import axios from 'axios'
import Cookies from "js-cookie"

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || '/api',
    withCredentials: true,
    timeout: 10000
})

api.interceptors.request.use((config) => {
    const token = Cookies.get('token')
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
})

api.interceptors.response.use(
    (response) => response.data,
    (error) => {
        if (error.response?.status === 401) {
            // Handle unauthorized
        }
        return Promise.reject(error.response?.data || error)
    }
)

export default api
