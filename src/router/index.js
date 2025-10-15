import { createRouter, createWebHashHistory } from 'vue-router'
import Login from '@/components/GoogleLogin.vue'
import HomePage from '@/views/HomePage.vue'
import { getUserRole } from '@/firebase';
import { auth } from '@/firebase';

const routes = [
  {
    path: '/',
    name: 'Login',
    component: Login,
    meta: { requiresAuth: false }
  },
  {
    path: '/home',
    name: 'HomePage',
    component: HomePage,
    meta: { requiresAuth: true }
  },
  {
    path: '/servers',
    name: 'ServerList',
    component: () => import('@/views/ServerList.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/devices',
    name: 'DeviceList',
    component: () => import('@/views/DeviceList.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/calendar',
    name: 'ReservationCalendar',
    component: () => import('@/views/ReservationCalendar.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/notices',
    name: 'NoticesPage',
    component: () => import('@/views/NoticePage.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/admin',
    name: 'AdminView',
    component: () => import('@/views/AdminView.vue'),
    meta: { requiresAuth: true }
  },
  // Add admin tab routes
  {
    path: '/admin/members',
    name: 'AdminMembers',
    component: () => import('@/views/AdminView.vue'),
    props: { defaultTab: 'members' },
    meta: { requiresAuth: true}
  },
  {
    path: '/admin/ownership',
    name: 'AdminOwnership',
    component: () => import('@/views/AdminView.vue'),
    props: { defaultTab: 'ownership' },
    meta: { requiresAuth: true}
  },
  // Catch-all route: redirect any unknown path to '/home'
  {
    path: '/:catchAll(.*)',
    redirect: '/home'
  }
];

const router = createRouter({
  history: createWebHashHistory(process.env.BASE_URL),
  routes
});

router.beforeEach(async (to, from, next) => {
  // Wait for Firebase Auth to initialize
  const waitForAuthInit = new Promise(resolve => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      unsubscribe();
      resolve(user);
    });
  });
  
  const user = await waitForAuthInit;
  
  // Check if the route requires authentication
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
  const requiresAdmin = to.matched.some(record => record.meta.requiresAdmin);
  
  // If route requires auth and user is not logged in, redirect to login page
  if (requiresAuth && !user) {
    console.log('Navigation guard: User not authenticated, redirecting to login');
    next({ path: '/' });
    return;
  }
  
  // If route requires admin role, check user's role
  if (requiresAdmin) {
    const userRole = await getUserRole();
    if (userRole !== 'admin') {
      console.log('Navigation guard: User is not an admin, redirecting to home');
      next({ path: '/home' });
      return;
    }
  }
  
  // If user is logged in and tries to access login page, redirect to home
  if (to.path === '/' && user) {
    console.log('Navigation guard: User already authenticated, redirecting to home');
    next({ path: '/home' });
    return;
  }
  
  // Otherwise continue to the requested route
  next();
});

export default router;