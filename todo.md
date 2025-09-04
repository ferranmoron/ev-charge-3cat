# EV Charging Point Admin App - MVP Implementation

## Core Features
1. Display 18 charging points with status (Available, In Use, Maintenance)
2. Waiting list management for users
3. 3-hour maximum usage timer per session
4. Simple admin interface to manage points and queue

## Files to Create
1. `src/pages/Index.tsx` - Main dashboard page
2. `src/components/ChargingPoint.tsx` - Individual charging point component
3. `src/components/WaitingList.tsx` - Queue management component
4. `src/components/UserForm.tsx` - Form to join waiting list
5. `src/components/AdminPanel.tsx` - Admin controls
6. `src/types/index.ts` - TypeScript interfaces
7. `src/hooks/useChargingPoints.ts` - State management hook

## Data Structure
- ChargingPoint: id, status, currentUser, startTime, endTime
- WaitingListEntry: id, userName, email, joinTime
- User session: 3-hour maximum limit

## Implementation Strategy
- Use localStorage for data persistence (simple MVP)
- Real-time timer updates for active sessions
- Simple queue system (FIFO)
- Basic admin controls for manual management