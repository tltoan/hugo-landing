# Hugo LBO Forum Implementation Plan

## Overview
This document outlines the implementation plan for adding real data persistence and full functionality to the Forum tab for each LBO problem. The goal is to create a LeetCode-style discussion forum where users can engage in meaningful discussions about specific LBO modeling problems.

## Current State
- ✅ Static Forum UI implemented with 4-tab navigation (Setup | Model | Solution | Forum)
- ✅ Visual mockup with sample comments, voting, and reply interfaces
- ✅ Problem-specific content that changes based on problemId
- ❌ No data persistence - all content is hard-coded
- ❌ No user authentication or real user management
- ❌ No functional voting, commenting, or reply systems

## Architecture Overview

### Backend Requirements

#### 1. Database Schema
```sql
-- Users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  display_name VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- LBO Problems reference
CREATE TABLE lbo_problems (
  id VARCHAR(10) PRIMARY KEY, -- '1', '2', '3', '4', '5'
  name VARCHAR(255) NOT NULL,  -- 'TechCorp LBO', 'RetailMax Buyout', etc.
  difficulty ENUM('beginner', 'intermediate', 'advanced') NOT NULL
);

-- Forum posts (top-level comments)
CREATE TABLE forum_posts (
  id SERIAL PRIMARY KEY,
  problem_id VARCHAR(10) NOT NULL,
  user_id INTEGER NOT NULL,
  title VARCHAR(255),
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_deleted BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (problem_id) REFERENCES lbo_problems(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX idx_problem_created (problem_id, created_at DESC)
);

-- Replies to posts (nested comments)
CREATE TABLE forum_replies (
  id SERIAL PRIMARY KEY,
  post_id INTEGER NOT NULL,
  parent_reply_id INTEGER NULL, -- for nested replies
  user_id INTEGER NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_deleted BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (post_id) REFERENCES forum_posts(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_reply_id) REFERENCES forum_replies(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX idx_post_created (post_id, created_at ASC)
);

-- Voting system
CREATE TABLE forum_votes (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  post_id INTEGER NULL,
  reply_id INTEGER NULL,
  vote_type ENUM('upvote', 'downvote') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (post_id) REFERENCES forum_posts(id) ON DELETE CASCADE,
  FOREIGN KEY (reply_id) REFERENCES forum_replies(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_post_vote (user_id, post_id),
  UNIQUE KEY unique_user_reply_vote (user_id, reply_id),
  CHECK ((post_id IS NOT NULL AND reply_id IS NULL) OR (post_id IS NULL AND reply_id IS NOT NULL))
);

-- User problem progress tracking
CREATE TABLE user_progress (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  problem_id VARCHAR(10) NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  score INTEGER DEFAULT 0,
  time_spent_seconds INTEGER DEFAULT 0,
  completed_at TIMESTAMP NULL,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (problem_id) REFERENCES lbo_problems(id),
  UNIQUE KEY unique_user_problem (user_id, problem_id)
);
```

#### 2. API Endpoints

##### Authentication Endpoints
```
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
```

##### Forum Endpoints
```
GET    /api/forum/:problemId/posts           # Get all posts for a problem
POST   /api/forum/:problemId/posts           # Create new post
GET    /api/forum/:problemId/posts/:postId   # Get specific post with replies
PUT    /api/forum/:problemId/posts/:postId   # Update post (author only)
DELETE /api/forum/:problemId/posts/:postId   # Delete post (author/admin only)

POST   /api/forum/posts/:postId/replies      # Add reply to post
POST   /api/forum/replies/:replyId/replies   # Add nested reply
PUT    /api/forum/replies/:replyId           # Update reply (author only)
DELETE /api/forum/replies/:replyId           # Delete reply (author/admin only)

POST   /api/forum/posts/:postId/vote         # Vote on post
POST   /api/forum/replies/:replyId/vote      # Vote on reply
DELETE /api/forum/posts/:postId/vote         # Remove vote on post
DELETE /api/forum/replies/:replyId/vote      # Remove vote on reply

GET    /api/forum/:problemId/stats           # Get forum stats (post count, etc.)
```

##### User Progress Endpoints
```
GET    /api/progress/:userId                 # Get user's problem progress
POST   /api/progress/:problemId/complete     # Mark problem as completed
PUT    /api/progress/:problemId/score        # Update problem score
```

### Frontend Implementation

#### 1. State Management
Use React Context or Redux for:
- **User authentication state**
- **Forum data caching**
- **Real-time updates**
- **Optimistic UI updates**

#### 2. Components Structure
```
src/components/Forum/
├── ForumContainer.tsx        # Main forum logic
├── PostList.tsx             # List of forum posts
├── PostItem.tsx             # Individual post component
├── ReplyList.tsx            # List of replies
├── ReplyItem.tsx            # Individual reply component
├── PostForm.tsx             # Create new post form
├── ReplyForm.tsx            # Reply form component
├── VoteButtons.tsx          # Voting UI component
├── UserAvatar.tsx           # User profile picture
└── ForumStats.tsx           # Forum statistics display
```

#### 3. Real-time Features (Optional)
- **WebSocket integration** for live comment updates
- **Optimistic UI** for instant feedback on votes/posts
- **Notification system** for replies to user's posts

### Technology Stack

#### Backend Options
1. **Node.js + Express + MySQL/PostgreSQL**
   - Familiar stack for most developers
   - Good performance for forum-style applications
   - Easy integration with existing React frontend

2. **Node.js + Fastify + PostgreSQL**
   - Higher performance than Express
   - Better TypeScript support
   - Schema validation built-in

3. **Python + FastAPI + PostgreSQL**
   - Excellent for rapid API development
   - Automatic OpenAPI documentation
   - Strong typing with Pydantic

#### Database Choice
- **PostgreSQL** (Recommended)
  - Excellent JSON support for flexible forum data
  - Strong ACID compliance
  - Good performance with proper indexing
  - Advanced text search capabilities

#### Authentication
1. **JWT + bcrypt** (Simple)
   - Stateless authentication
   - Easy to implement
   - Good for MVP

2. **Auth0 / Firebase Auth** (Enterprise)
   - Third-party authentication
   - Social login support
   - More secure, less maintenance

#### Hosting & Deployment
- **Backend**: Railway, Render, or DigitalOcean
- **Database**: Railway PostgreSQL, or AWS RDS
- **Frontend**: Netlify or Vercel (existing)

## Implementation Phases

### Phase 1: Core Backend (Week 1-2)
- [ ] Set up Node.js/Express server
- [ ] Implement database schema
- [ ] Create authentication endpoints
- [ ] Implement basic CRUD for posts and replies
- [ ] Add voting system endpoints
- [ ] API testing with Postman/Insomnia

### Phase 2: Frontend Integration (Week 3)
- [ ] Replace hard-coded forum with real API calls
- [ ] Implement user authentication flow
- [ ] Create dynamic post and reply components
- [ ] Add real-time voting functionality
- [ ] Handle loading states and error cases

### Phase 3: Enhanced Features (Week 4)
- [ ] Add user profiles and avatars
- [ ] Implement forum moderation features
- [ ] Add search and filtering capabilities
- [ ] Create forum statistics and analytics
- [ ] Add email notifications for replies

### Phase 4: Polish & Optimization (Week 5)
- [ ] Implement caching strategies
- [ ] Add real-time updates with WebSockets
- [ ] Performance optimization
- [ ] Mobile responsiveness improvements
- [ ] Security audit and rate limiting

## Security Considerations

### Authentication & Authorization
- **Password security**: bcrypt hashing with salt rounds ≥ 12
- **JWT security**: Short expiration times, secure secret keys
- **Rate limiting**: Prevent spam posting and voting abuse
- **Input validation**: Sanitize all user inputs to prevent XSS

### Data Protection
- **SQL injection prevention**: Use parameterized queries
- **CORS configuration**: Restrict origins in production
- **Content moderation**: Flag inappropriate content
- **User privacy**: Don't expose sensitive user data

### Forum-Specific Security
- **Vote manipulation prevention**: One vote per user per post/reply
- **Spam protection**: Rate limit post creation
- **Content validation**: Maximum post/reply lengths
- **User reputation system**: Trust levels based on participation

## Performance Considerations

### Database Optimization
- **Proper indexing**: On problem_id, user_id, created_at
- **Query optimization**: Use LIMIT for pagination
- **Connection pooling**: Manage database connections efficiently
- **Caching**: Redis for frequently accessed data

### Frontend Optimization
- **Pagination**: Load posts in chunks (20-50 per page)
- **Lazy loading**: Load replies on demand
- **Optimistic updates**: Instant UI feedback
- **Data caching**: Cache forum data client-side

## Monitoring & Analytics

### Key Metrics to Track
- **User engagement**: Posts per day, replies per day
- **Problem difficulty**: Which problems get most discussion
- **User retention**: Return forum usage patterns
- **Content quality**: Upvote/downvote ratios

### Tools
- **Application monitoring**: New Relic or DataDog
- **Error tracking**: Sentry
- **Analytics**: Custom dashboard with forum-specific metrics
- **Database monitoring**: Query performance and optimization

## Success Metrics

### Engagement Metrics
- **Daily active forum users**: Target 20% of total users
- **Posts per problem**: Target 5+ meaningful discussions per problem
- **Response rate**: 80% of questions get at least one reply
- **User retention**: 60% of forum users return within 7 days

### Quality Metrics
- **Helpful content ratio**: 70% of posts have net positive votes
- **Problem feedback**: Clear correlation between forum discussions and problem improvements
- **Community moderation**: Self-moderated community with minimal admin intervention

## Future Enhancements

### Advanced Features
- **Markdown support** for rich text formatting
- **Code syntax highlighting** for formula discussions
- **File attachments** for sharing model screenshots
- **Tagging system** for categorizing discussions
- **Expert verification** badges for industry professionals

### Integration Opportunities
- **LBO model sharing**: Export/import completed models
- **Peer review system**: Get feedback on model approaches
- **Study groups**: Form groups around specific problems
- **Leaderboard integration**: Forum participation affects rankings

### Community Features
- **User badges**: Recognition for helpful contributions
- **Mentorship program**: Connect beginners with experts
- **Weekly challenges**: Special discussion topics
- **AMA sessions**: Q&A with industry professionals

## Conclusion

This implementation plan provides a comprehensive roadmap for transforming the static Forum tab into a fully functional, LeetCode-style discussion platform. The phased approach allows for iterative development and testing, ensuring a robust and engaging user experience.

The key to success will be:
1. **Start simple**: MVP with core posting and voting features
2. **Focus on user experience**: Smooth, responsive interface
3. **Encourage quality discussions**: Good moderation and incentives
4. **Scale thoughtfully**: Monitor usage and optimize accordingly

By implementing this forum system, Hugo will become not just a learning platform but a community where students and professionals can collaborate, learn from each other, and improve their LBO modeling skills together.