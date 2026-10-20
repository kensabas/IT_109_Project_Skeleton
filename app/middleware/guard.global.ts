// Wave 1.4 [F-05, F-06] — mock route guard (front end only, not real
// security). The rules live in app/utils/access.ts and are unit-tested.
import { useCurrentUserStore } from '~/stores/currentUser'
import { routeDecision } from '~/utils/access'

export default defineNuxtRouteMiddleware((to) => {
  const session = useCurrentUserStore()
  const decision = routeDecision(session.currentUser, to.path)

  if (decision.action === 'allow') return
  if (decision.action === 'sign-out') {
    session.logOut()
    return navigateTo(decision.to)
  }
  return navigateTo({ path: decision.to, query: decision.notice ? { notice: decision.notice } : {} })
})
