// lucide-react's brand icon set (Github, etc.) was removed upstream; a
// generic external-link glyph is used for repo/demo links instead.
import { ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import type { Project } from '@/content/projects';
import { cn } from '@/lib/utils';

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <Card className="flex flex-col overflow-hidden">
      {project.screenshot ? (
        <img
          src={project.screenshot}
          alt={`${project.name} screenshot`}
          className="h-48 w-full object-cover"
        />
      ) : (
        <div
          aria-hidden="true"
          className="flex h-48 w-full items-center justify-center bg-muted text-sm text-muted-foreground"
        >
          Screenshot coming
        </div>
      )}

      <CardHeader>
        <CardTitle className="text-lg">{project.name}</CardTitle>
        <CardDescription>{project.tagline}</CardDescription>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-4">
        <p className="text-sm text-muted-foreground">{project.description}</p>

        <div className="flex flex-wrap gap-2">
          {project.tech.map((tech) => (
            <Badge key={tech} variant="secondary">
              {tech}
            </Badge>
          ))}
        </div>

        <p className="text-sm text-muted-foreground">
          {project.role}
          {project.period ? ` · ${project.period}` : ''}
        </p>
      </CardContent>

      <CardFooter>
        {project.visibility === 'public' ? (
          <div className="flex flex-wrap gap-2">
            {project.links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noreferrer"
                className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
              >
                <ExternalLink aria-hidden="true" />
                {link.label}
              </a>
            ))}
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">Professional work &mdash; private</span>
        )}
      </CardFooter>
    </Card>
  );
}
