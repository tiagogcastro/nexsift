import {
  Brain,
  Cloud,
  Cpu,
  Factory,
  PenTool,
  ShieldCheck,
  Terminal,
  type LucideIcon,
} from 'lucide-react'
import type { Topic } from '@nexsift/schemas/topic'

export const topicIcons: Record<Topic, LucideIcon> = {
  ai: Brain,
  cloud: Cloud,
  development: Cpu,
  devops: Terminal,
  security: ShieldCheck,
  industry: Factory,
  design: PenTool,
}