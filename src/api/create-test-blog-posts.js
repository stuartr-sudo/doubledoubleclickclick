// TEST: Create test blog posts for editor testing
// This script creates sample blog posts to test editor functions

import { BlogPost } from './entities.js';
import { getCurrentUser } from '../lib/supabase.js';

const testBlogPosts = [
  {
    title: "The Future of AI in Content Creation",
    content: `
# The Future of AI in Content Creation

Artificial Intelligence is revolutionizing how we create content. From automated writing tools to intelligent content optimization, AI is becoming an indispensable part of the content creation process.

## Key Benefits of AI Content Creation

1. **Speed and Efficiency**: AI can generate content at unprecedented speeds
2. **Consistency**: Maintains consistent tone and style across all content
3. **Scalability**: Create large volumes of content without proportional resource increases
4. **Personalization**: Tailor content to specific audiences automatically

## Popular AI Content Tools

- **GPT-4**: Advanced language model for text generation
- **Claude**: Anthropic's AI assistant for creative writing
- **Jasper**: Marketing-focused AI content platform
- **Copy.ai**: Specialized in marketing copy and social media content

## Best Practices

When using AI for content creation, it's important to:

- Always review and edit AI-generated content
- Maintain your brand voice and personality
- Use AI as a starting point, not the final product
- Ensure factual accuracy and proper citations

## The Human Touch

While AI can generate content efficiently, the human element remains crucial. The best content combines AI efficiency with human creativity, insight, and emotional intelligence.

*This article was created to demonstrate the capabilities of our AI-powered content creation platform.*
    `,
    status: "published",
    tags: ["AI", "Content Creation", "Technology", "Future"],
    category: "Technology",
    seo_title: "AI Content Creation: The Future of Digital Marketing",
    seo_description: "Discover how AI is transforming content creation and what it means for marketers and content creators.",
    featured_image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=400&fit=crop",
    author: "AI Content Team",
    reading_time: "5 min read"
  },
  {
    title: "10 Essential SEO Strategies for 2024",
    content: `
# 10 Essential SEO Strategies for 2024

Search Engine Optimization continues to evolve, and 2024 brings new challenges and opportunities. Here are the essential strategies you need to implement.

## 1. Core Web Vitals Optimization

Google's Core Web Vitals remain crucial for ranking:

- **Largest Contentful Paint (LCP)**: Aim for under 2.5 seconds
- **First Input Delay (FID)**: Keep under 100 milliseconds
- **Cumulative Layout Shift (CLS)**: Maintain score under 0.1

## 2. E-A-T and YMYL Content

Expertise, Authoritativeness, and Trustworthiness are more important than ever:

- Establish author credentials
- Cite reliable sources
- Build domain authority through quality backlinks
- Create comprehensive, well-researched content

## 3. Mobile-First Indexing

With mobile-first indexing, ensure your site is:

- Fully responsive across all devices
- Fast-loading on mobile networks
- Easy to navigate on small screens
- Optimized for touch interactions

## 4. Voice Search Optimization

Voice search continues to grow:

- Target conversational keywords
- Answer questions directly
- Use natural language patterns
- Create FAQ sections

## 5. Featured Snippets Strategy

Optimize for featured snippets:

- Structure content with clear headings
- Provide direct answers to questions
- Use lists and tables for easy scanning
- Keep answers concise and informative

## 6. Local SEO for Businesses

For local businesses:

- Optimize Google My Business profiles
- Collect and manage customer reviews
- Use local keywords naturally
- Create location-specific content

## 7. Technical SEO Fundamentals

Don't neglect the basics:

- Proper URL structure
- XML sitemaps
- Robots.txt optimization
- Internal linking strategy
- Schema markup implementation

## 8. Content Quality and Depth

Create content that truly serves users:

- Comprehensive coverage of topics
- Original research and insights
- Regular content updates
- User engagement metrics

## 9. Page Experience Signals

Focus on user experience:

- Fast loading times
- Intuitive navigation
- Clear call-to-actions
- Mobile-friendly design

## 10. Analytics and Monitoring

Track your progress:

- Google Search Console
- Google Analytics 4
- Keyword ranking tools
- Competitor analysis

## Conclusion

SEO in 2024 requires a holistic approach combining technical optimization, content quality, and user experience. Focus on creating value for your audience while maintaining technical excellence.

*Stay ahead of the competition with these proven SEO strategies.*
    `,
    status: "draft",
    tags: ["SEO", "Digital Marketing", "Search Optimization", "2024"],
    category: "Marketing",
    seo_title: "10 Essential SEO Strategies for 2024: Complete Guide",
    seo_description: "Master the latest SEO strategies for 2024. Learn about Core Web Vitals, E-A-T, voice search, and more.",
    featured_image: "https://images.unsplash.com/photo-1432888622747-4eb9a8efeb07?w=800&h=400&fit=crop",
    author: "SEO Expert",
    reading_time: "8 min read"
  },
  {
    title: "Building a Successful Content Marketing Strategy",
    content: `
# Building a Successful Content Marketing Strategy

Content marketing is more than just creating blog posts. It's about building a comprehensive strategy that drives results for your business.

## Understanding Your Audience

Before creating any content, you need to understand your audience:

### Create Buyer Personas

- Demographics and psychographics
- Pain points and challenges
- Goals and aspirations
- Preferred content formats
- Online behavior patterns

### Research Your Audience

- Conduct surveys and interviews
- Analyze social media engagement
- Review customer feedback
- Study competitor content performance

## Content Planning and Strategy

### Content Pillars

Develop 3-5 main content pillars that align with your business goals:

1. **Educational Content**: How-to guides, tutorials, tips
2. **Entertainment Content**: Stories, humor, engaging narratives
3. **Inspirational Content**: Success stories, motivational content
4. **Promotional Content**: Product features, case studies
5. **Community Content**: User-generated content, discussions

### Content Calendar

Plan your content in advance:

- Monthly and quarterly themes
- Seasonal content opportunities
- Industry events and holidays
- Product launch timelines
- Evergreen vs. trending topics

## Content Types and Formats

### Blog Posts and Articles

- Long-form content (2000+ words)
- How-to guides and tutorials
- Industry insights and analysis
- Case studies and success stories

### Visual Content

- Infographics and data visualizations
- Images and graphics
- Videos and animations
- Interactive content

### Social Media Content

- Platform-specific content
- Stories and live content
- User-generated content
- Community engagement

## Content Creation Process

### Research and Planning

1. **Keyword Research**: Find relevant topics and search terms
2. **Competitor Analysis**: Study what works for others
3. **Content Gap Analysis**: Identify opportunities
4. **Topic Clustering**: Group related content ideas

### Writing and Production

1. **Outline Creation**: Structure your content
2. **First Draft**: Focus on getting ideas down
3. **Editing and Revision**: Polish and refine
4. **Visual Elements**: Add images, videos, graphics
5. **SEO Optimization**: Optimize for search engines

### Review and Approval

1. **Internal Review**: Team feedback and suggestions
2. **Fact-Checking**: Verify all information
3. **Brand Alignment**: Ensure content matches brand voice
4. **Legal Review**: Check for compliance issues

## Distribution and Promotion

### Owned Media

- Company website and blog
- Email newsletters
- Mobile apps
- Customer portals

### Earned Media

- Social media shares
- Media mentions
- Influencer partnerships
- User-generated content

### Paid Media

- Social media advertising
- Content promotion
- Influencer collaborations
- Sponsored content

## Measuring Success

### Key Metrics

- **Traffic Metrics**: Page views, unique visitors, session duration
- **Engagement Metrics**: Likes, shares, comments, time on page
- **Conversion Metrics**: Leads generated, sales attributed
- **SEO Metrics**: Keyword rankings, organic traffic growth

### Analytics Tools

- Google Analytics
- Social media analytics
- Email marketing platforms
- Content management systems

## Best Practices

### Content Quality

- Focus on value and relevance
- Maintain consistent brand voice
- Use clear, engaging headlines
- Include compelling calls-to-action

### SEO Optimization

- Target relevant keywords naturally
- Optimize meta descriptions and titles
- Use proper heading structure
- Include internal and external links

### User Experience

- Make content scannable with headings and lists
- Use high-quality images and videos
- Ensure mobile responsiveness
- Optimize loading speeds

## Common Mistakes to Avoid

1. **Publishing without a strategy**
2. **Ignoring your audience's needs**
3. **Focusing only on promotional content**
4. **Neglecting SEO optimization**
5. **Not measuring and analyzing results**
6. **Inconsistent publishing schedule**
7. **Poor content quality**
8. **Ignoring mobile optimization**

## Conclusion

A successful content marketing strategy requires careful planning, consistent execution, and continuous optimization. Focus on creating valuable content for your audience while aligning with your business goals.

*Remember: Content marketing is a long-term strategy that builds trust and authority over time.*
    `,
    status: "published",
    tags: ["Content Marketing", "Strategy", "Digital Marketing", "Business"],
    category: "Marketing",
    seo_title: "Complete Guide to Content Marketing Strategy in 2024",
    seo_description: "Learn how to build a successful content marketing strategy that drives results for your business.",
    featured_image: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=400&fit=crop",
    author: "Marketing Team",
    reading_time: "12 min read"
  },
  {
    title: "The Psychology of Color in Web Design",
    content: `
# The Psychology of Color in Web Design

Colors have a profound impact on user behavior and perception. Understanding color psychology can significantly improve your web design and conversion rates.

## Understanding Color Psychology

### Primary Colors and Their Meanings

**Red**
- Associated with: Energy, passion, urgency, danger
- Best for: Call-to-action buttons, sales, alerts
- Use sparingly: Can create anxiety if overused

**Blue**
- Associated with: Trust, stability, professionalism, calm
- Best for: Corporate websites, healthcare, technology
- Most popular: Universally liked and trusted

**Green**
- Associated with: Nature, growth, money, health
- Best for: Environmental, financial, health websites
- Versatile: Works well in many contexts

**Yellow**
- Associated with: Happiness, optimism, creativity, caution
- Best for: Creative industries, children's sites
- Use carefully: Can be overwhelming in large amounts

**Purple**
- Associated with: Luxury, creativity, mystery, spirituality
- Best for: Beauty, fashion, luxury brands
- Sophisticated: Conveys premium quality

**Orange**
- Associated with: Enthusiasm, energy, warmth, fun
- Best for: Entertainment, food, sports
- Attention-grabbing: Great for CTAs

## Color Combinations and Harmonies

### Complementary Colors
- Colors opposite on the color wheel
- Creates high contrast and energy
- Examples: Red/Green, Blue/Orange, Purple/Yellow

### Analogous Colors
- Colors next to each other on the color wheel
- Creates harmony and cohesion
- Examples: Blue/Green/Teal, Red/Orange/Yellow

### Triadic Colors
- Three colors evenly spaced on the color wheel
- Creates vibrant, balanced designs
- Examples: Red/Yellow/Blue, Orange/Green/Purple

## Cultural Considerations

### Western Cultures
- Red: Love, passion, danger
- Blue: Trust, stability, sadness
- Green: Nature, money, go
- Yellow: Happiness, caution, cowardice

### Eastern Cultures
- Red: Luck, prosperity, celebration
- White: Death, mourning (in some cultures)
- Black: Sophistication, mourning
- Gold: Wealth, prosperity

## Industry-Specific Color Guidelines

### Healthcare
- **Primary**: Blue, green, white
- **Avoid**: Red (associated with danger)
- **Focus**: Trust, cleanliness, healing

### Finance
- **Primary**: Blue, green, gray
- **Avoid**: Red (associated with loss)
- **Focus**: Trust, stability, growth

### Technology
- **Primary**: Blue, gray, white
- **Accent**: Orange, green
- **Focus**: Innovation, reliability, efficiency

### Food & Beverage
- **Primary**: Red, orange, yellow
- **Avoid**: Blue (appetite suppressant)
- **Focus**: Appetite, energy, warmth

### Fashion & Beauty
- **Primary**: Black, white, pink, purple
- **Accent**: Gold, silver
- **Focus**: Luxury, elegance, sophistication

## Accessibility and Color

### Color Blindness Considerations
- 8% of men and 0.5% of women have color vision deficiency
- Don't rely solely on color to convey information
- Use patterns, shapes, and text labels
- Test with color blindness simulators

### Contrast Requirements
- **WCAG AA**: 4.5:1 ratio for normal text
- **WCAG AAA**: 7:1 ratio for normal text
- **Large text**: 3:1 ratio minimum
- Use tools like WebAIM's contrast checker

## Color in User Interface Design

### Navigation and Menus
- Use consistent colors for navigation elements
- Ensure sufficient contrast for readability
- Consider hover and active states

### Buttons and CTAs
- Use contrasting colors for primary actions
- Maintain consistency across the site
- Test different colors for conversion optimization

### Forms and Input Fields
- Use subtle colors for input fields
- Red for error states, green for success
- Maintain accessibility standards

## A/B Testing Color Variations

### What to Test
- Primary CTA button colors
- Background colors
- Text colors for readability
- Accent colors for emphasis

### Metrics to Track
- Click-through rates
- Conversion rates
- Time on page
- Bounce rates
- User engagement

## Tools and Resources

### Color Palette Generators
- Adobe Color
- Coolors.co
- Paletton
- Material Design Color Tool

### Accessibility Tools
- WebAIM Contrast Checker
- Color Oracle (color blindness simulator)
- Stark (Figma plugin)
- axe DevTools

### Inspiration Sources
- Dribbble
- Behance
- Pinterest
- Design inspiration websites

## Best Practices

### Start with a Base Color
- Choose one primary color that represents your brand
- Build your palette around this color
- Consider your brand personality and values

### Limit Your Palette
- Use 2-3 main colors maximum
- Add neutrals (black, white, gray) for balance
- Use accent colors sparingly

### Consider Context
- Think about where colors will be used
- Consider the emotional response you want
- Test with your target audience

### Maintain Consistency
- Create a style guide
- Document color codes and usage
- Train your team on color guidelines

## Common Mistakes

1. **Using too many colors**
2. **Ignoring accessibility requirements**
3. **Not considering cultural differences**
4. **Poor contrast ratios**
5. **Inconsistent color usage**
6. **Not testing with real users**
7. **Ignoring brand guidelines**
8. **Using trendy colors without strategy**

## Conclusion

Color psychology in web design is a powerful tool that can significantly impact user behavior and conversion rates. By understanding the psychological effects of colors and implementing them strategically, you can create more effective and engaging web experiences.

*Remember: The best color choices are those that align with your brand, serve your users, and achieve your business goals.*
    `,
    status: "draft",
    tags: ["Web Design", "Color Psychology", "UX Design", "Design"],
    category: "Design",
    seo_title: "Color Psychology in Web Design: Complete Guide 2024",
    seo_description: "Learn how to use color psychology in web design to improve user experience and conversion rates.",
    featured_image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=400&fit=crop",
    author: "Design Team",
    reading_time: "10 min read"
  },
  {
    title: "Getting Started with React: A Beginner's Guide",
    content: `
# Getting Started with React: A Beginner's Guide

React is one of the most popular JavaScript libraries for building user interfaces. This comprehensive guide will help you get started with React development.

## What is React?

React is a JavaScript library created by Facebook (now Meta) for building user interfaces, particularly web applications. It's component-based, declarative, and efficient.

### Key Features

- **Component-Based Architecture**: Build encapsulated components that manage their own state
- **Virtual DOM**: Efficient updates and rendering
- **JSX**: Write HTML-like syntax in JavaScript
- **Unidirectional Data Flow**: Predictable state management
- **Rich Ecosystem**: Extensive community and third-party libraries

## Prerequisites

Before diving into React, you should have:

- Basic knowledge of HTML, CSS, and JavaScript
- Understanding of ES6+ features
- Familiarity with Node.js and npm
- Basic command line skills

## Setting Up Your Development Environment

### Install Node.js

1. Visit [nodejs.org](https://nodejs.org)
2. Download and install the LTS version
3. Verify installation: \`node --version\` and \`npm --version\`

### Create a New React App

Run these commands in your terminal:
npx create-react-app my-react-app
cd my-react-app
npm start

### Alternative: Using Vite

Run these commands in your terminal:
npm create vite@latest my-react-app -- --template react
cd my-react-app
npm install
npm run dev

## Understanding JSX

JSX (JavaScript XML) allows you to write HTML-like syntax in JavaScript:

const element = <h1>Hello, World!</h1>;

### JSX Rules

1. **Return a single element** (or use fragments)
2. **Use camelCase** for attributes
3. **Close all tags** properly
4. **Use className** instead of class

Example of correct JSX:
const element = (
  <div className="container">
    <h1>Hello World</h1>
    <p>This is a paragraph</p>
  </div>
);

Example of incorrect JSX:
const element = (
  <div class="container">
    <h1>Hello World</h1>
    <p>This is a paragraph</p>
  </div>
);

## Components

### Functional Components


function Welcome(props) {
  return <h1>Hello, {props.name}!</h1>;
}

// Arrow function syntax
const Welcome = (props) => {
  return <h1>Hello, {props.name}!</h1>;
};


### Class Components


class Welcome extends React.Component {
  render() {
    return <h1>Hello, {this.props.name}!</h1>;
  }
}


## Props

Props (properties) are how you pass data from parent to child components:


function UserCard(props) {
  return (
    <div className="user-card">
      <h2>{props.name}</h2>
      <p>{props.email}</p>
      <p>Age: {props.age}</p>
    </div>
  );
}

// Usage
<UserCard name="John Doe" email="john@example.com" age={25} />


## State

State allows components to manage their own data:

### Using useState Hook


import React, { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>
        Increment
      </button>
    </div>
  );
}


### Using State in Class Components


class Counter extends React.Component {
  constructor(props) {
    super(props);
    this.state = { count: 0 };
  }

  increment = () => {
    this.setState({ count: this.state.count + 1 });
  }

  render() {
    return (
      <div>
        <p>Count: {this.state.count}</p>
        <button onClick={this.increment}>
          Increment
        </button>
      </div>
    );
  }
}


## Event Handling


function Button() {
  const handleClick = () => {
    alert('Button clicked!');
  };

  return (
    <button onClick={handleClick}>
      Click me
    </button>
  );
}


## Conditional Rendering


function Greeting({ isLoggedIn }) {
  if (isLoggedIn) {
    return <h1>Welcome back!</h1>;
  }
  return <h1>Please sign in.</h1>;
}

// Using ternary operator
function Greeting({ isLoggedIn }) {
  return (
    <div>
      {isLoggedIn ? <h1>Welcome back!</h1> : <h1>Please sign in.</h1>}
    </div>
  );
}


## Lists and Keys


function TodoList({ todos }) {
  return (
    <ul>
      {todos.map(todo => (
        <li key={todo.id}>
          {todo.text}
        </li>
      ))}
    </ul>
  );
}


## Forms

### Controlled Components


function ContactForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Name:', name, 'Email:', email);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Name"
      />
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
      />
      <button type="submit">Submit</button>
    </form>
  );
}


## Lifecycle Methods and useEffect

### useEffect Hook


import React, { useState, useEffect } from 'react';

function DataFetcher() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/data')
      .then(response => response.json())
      .then(data => {
        setData(data);
        setLoading(false);
      });
  }, []); // Empty dependency array = run once

  if (loading) return <div>Loading...</div>;
  return <div>{data}</div>;
}


## Best Practices

### Component Organization


src/
  components/
    Button/
      Button.jsx
      Button.css
      index.js
    Header/
      Header.jsx
      Header.css
      index.js
  pages/
    Home.jsx
    About.jsx
  App.jsx


### Naming Conventions

- Use PascalCase for components
- Use camelCase for functions and variables
- Use descriptive names
- Use consistent file naming

### Code Structure


// 1. Imports
import React, { useState, useEffect } from 'react';
import './Component.css';

// 2. Component definition
function MyComponent({ prop1, prop2 }) {
  // 3. State declarations
  const [state, setState] = useState(initialValue);
  
  // 4. Effect hooks
  useEffect(() => {
    // Effect logic
  }, [dependencies]);
  
  // 5. Event handlers
  const handleEvent = () => {
    // Handler logic
  };
  
  // 6. Render
  return (
    <div>
      {/* JSX content */}
    </div>
  );
}

// 7. Export
export default MyComponent;


## Common Mistakes to Avoid

1. **Mutating state directly**
2. **Using array index as key**
3. **Not handling loading states**
4. **Overusing useEffect**
5. **Not cleaning up effects**
6. **Prop drilling**
7. **Not using proper event handlers**
8. **Ignoring accessibility**

## Next Steps

### Learn More Advanced Concepts

- **React Router**: For navigation
- **State Management**: Redux, Zustand, or Context API
- **Testing**: Jest and React Testing Library
- **Performance**: React.memo, useMemo, useCallback
- **Server-Side Rendering**: Next.js

### Build Projects

1. **Todo App**: Practice state management
2. **Weather App**: Learn API integration
3. **Blog**: Practice routing and data fetching
4. **E-commerce**: Complex state management
5. **Social Media**: Real-time features

## Resources

### Official Documentation
- [React Documentation](https://react.dev)
- [React Tutorial](https://react.dev/learn)

### Learning Resources
- FreeCodeCamp React Course
- React for Beginners by Wes Bos
- Full Stack React by Anthony Accomazzo

### Tools and Libraries
- **Create React App**: Boilerplate setup
- **Vite**: Fast build tool
- **React DevTools**: Browser extension
- **Storybook**: Component development

## Conclusion

React is a powerful library that makes building user interfaces enjoyable and efficient. Start with the basics, practice regularly, and gradually explore more advanced concepts.

*Remember: The best way to learn React is by building projects and experimenting with code.*

Happy coding! 🚀
    `,
    status: "published",
    tags: ["React", "JavaScript", "Web Development", "Tutorial"],
    category: "Development",
    seo_title: "React Tutorial for Beginners: Complete Guide 2024",
    seo_description: "Learn React from scratch with this comprehensive beginner's guide. Build your first React app today!",
    featured_image: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&h=400&fit=crop",
    author: "Development Team",
    reading_time: "15 min read"
  }
];

export async function createTestBlogPosts() {
  try {
    console.log('🧪 Creating test blog posts...');
    
    // Get current user
    const user = await getCurrentUser();
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    const createdPosts = [];
    
    for (const postData of testBlogPosts) {
      const blogPost = {
        ...postData,
        user_id: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const createdPost = await BlogPost.create(blogPost);
      createdPosts.push(createdPost);
      console.log(`✅ Created blog post: "${createdPost.title}"`);
    }
    
    console.log(`🎉 Successfully created ${createdPosts.length} test blog posts`);
    return createdPosts;
    
  } catch (error) {
    console.error('❌ Error creating test blog posts:', error);
    throw error;
  }
}

// Auto-run in development
if (import.meta.env.DEV) {
  console.log('Creating test blog posts...');
  createTestBlogPosts().catch(console.error);
}
