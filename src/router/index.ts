import { createRouter, createWebHistory } from "@ionic/vue-router";
import { RouteRecordRaw } from "vue-router";
import HomePage from "../views/HomePage.vue";
import { useAuthStore } from "../stores/authStore";
import FarmersListPage from "@/views/Farmers/FarmersListPage.vue";

const routes: Array<RouteRecordRaw> = [
  {
    path: "/",
    redirect: "/login",
  },
  {
    path: "/home",
    name: "Home",
    component: HomePage,
  },
  {
    path: "/farmers",
    name: "FarmersList",
    component: FarmersListPage,
  },
  {
    path: "/farmers/register",
    name: "FarmersRegister",
    component: () => import("@/views/Farmers/Registration_Form.vue"),
  },
  {
    path: "/dashboard",
    name: "Dashboard",
    component: () => import("@/views/DashboardPage.vue"),
  },
  {
    path: "/login",
    name: "Login",
    component: () => import("@/views/LoginPage.vue"),
    meta: { requiresAuth: false },
  },
  {
    path: "/dashboard",
    name: "AdminDashboard",
    component: () => import("@/views/DashboardPage.vue"),
    meta: {
      requiresAuth: true,
      role: "admin", // Only admins can access
    },
  },
  {
    path: "/technician-home",
    name: "TechnicianHome",
    component: () => import("@/views/HomePage.vue"), // Or a specific Tech UI
    meta: {
      requiresAuth: true,
      role: "technician", // Only technicians can access
    },
  },
  {
    path: "/ScanQR",
    name: "ScanQR",
    component: () => import("@/views/Scanner/ScannerPage.vue"),
    meta: {
      requiresAuth: true,
      role: "technician", // Only technicians can access
    },
  },
  {
    path: "/programs",
    name: "Programs",
    component: () => import("@/views/Programs/ProgramsListPage.vue"),
    meta: { requiresAuth: true },
  },
  {
      path: '/id-issuance',
      name: 'IdIssuance',
      component: () => import('@/views/Farmers/IdIssuancePage.vue'),
      meta: { requiresAuth: true }
    },
  {
      path: '/broadcasts',
      name: 'Broadcasts',
      component: () => import('@/views/Communication/BroadcastCenterPage.vue'),
      meta: { requiresAuth: true }
    },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

// DEVELOPER MODE SWITCH
// Set to true to let UI designers work freely without logging in.
// Set to false for production / testing real API data.
const DEV_BYPASS_AUTH = true;

// Global Route Guard
router.beforeEach((to, from, next) => {
  if (DEV_BYPASS_AUTH) {
    return next();
  }

  const authStore = useAuthStore();
  const isAuthenticated = authStore.isAuthenticated;
  const userRole = authStore.userRole?.value;

  // 1. If route requires auth and user is NOT logged in
  if (to.meta.requiresAuth && !isAuthenticated) {
    next({ name: "Login" });
  }
  // 2. If user is logged in, restrict access by role
  else if (to.meta.requiresAuth && to.meta.role && to.meta.role !== userRole) {
    // Redirect to their respective default page if they try to access the wrong role's page
    next(
      userRole === "admin" ?
        { name: "AdminDashboard" }
      : { name: "TechnicianHome" },
    );
  }
  // 3. If logged-in user tries to access the login page
  else if (to.name === "Login" && isAuthenticated) {
    next(
      userRole === "admin" ?
        { name: "AdminDashboard" }
      : { name: "TechnicianHome" },
    );
  }
  // 4. Otherwise, let them proceed
  else {
    next();
  }
});
export default router;
