import React from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { SEOHead } from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { REVISION_TOPICS, RevisionTopic } from "@/data/revisionTopics";
import { BookOpen, ChevronRight, Bot, FileText, ArrowRight } from "lucide-react";

export const RevisionTopicPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const topic = REVISION_TOPICS.find((t) => t.slug === slug);

  if (!topic) {
    return (
      <div className="min-h-screen bg-background">
        <Header showNavLinks />
        <div className="max-w-3xl mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Topic not found</h1>
          <p className="text-muted-foreground mb-6">This revision page doesn't exist yet.</p>
          <Link to="/"><Button variant="brand">Back to Home</Button></Link>
        </div>
      </div>
    );
  }

  const relatedTopics = topic.relatedSlugs
    .map((s) => REVISION_TOPICS.find((t) => t.slug === s))
    .filter(Boolean) as RevisionTopic[];

  const tutorUrl = `/s/${topic.productSlug}/free`;
  const metaTitle = `${topic.topic} Revision | ${topic.examBoard} ${topic.subject} | A* AI`;
  const metaDesc = `Revise ${topic.topic} for ${topic.examBoard} ${topic.subject}. Key concepts, exam questions, and AI-powered tutoring with exam-board-specific feedback. Start free.`;
  const canonicalUrl = `https://astarai.co.uk/revision/${topic.slug}`;

  // FAQ structured data (JSON-LD)
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: topic.faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  // Breadcrumb structured data
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://astarai.co.uk" },
      { "@type": "ListItem", position: 2, name: `${topic.examBoard} ${topic.subject}`, item: `https://astarai.co.uk/s/${topic.productSlug}/free` },
      { "@type": "ListItem", position: 3, name: `${topic.topic} Revision`, item: canonicalUrl },
    ],
  };

  return (
    <div className="min-h-screen bg-background font-sans">
      <SEOHead
        title={metaTitle}
        description={metaDesc}
        canonical={canonicalUrl}
      />

      {/* Structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <Header showNavLinks />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-6">
          <Link to="/" className="hover:text-foreground">Home</Link>
          <ChevronRight className="h-3 w-3" />
          <Link to={tutorUrl} className="hover:text-foreground">{topic.examBoard} {topic.subject}</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground font-medium">{topic.topic}</span>
        </nav>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Badge variant="outline" className="text-xs">{topic.examBoard}</Badge>
            <Badge variant="secondary" className="text-xs">{topic.subject}</Badge>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight mb-3">
            {topic.topic} — {topic.examBoard} {topic.subject} Revision
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            {topic.intro}
          </p>
        </div>

        {/* CTA */}
        <Card className="mb-8 border-2 border-primary/20 bg-primary/5">
          <CardContent className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Bot className="h-8 w-8 text-primary flex-shrink-0" />
              <div>
                <p className="font-bold text-sm">Practice {topic.topic} with AI</p>
                <p className="text-xs text-muted-foreground">
                  Get instant, {topic.examBoard}-specific feedback on your answers
                </p>
              </div>
            </div>
            <Button variant="brand" className="rounded-full whitespace-nowrap" onClick={() => navigate(tutorUrl)}>
              Start Revising <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </CardContent>
        </Card>

        {/* Key Concepts */}
        <section className="mb-8">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Key Concepts
          </h2>
          <ul className="space-y-2.5">
            {topic.keyConcepts.map((concept, i) => (
              <li key={i} className="flex items-start gap-3 text-sm leading-relaxed">
                <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0 mt-2" />
                {concept}
              </li>
            ))}
          </ul>
        </section>

        {/* Common Exam Questions */}
        <section className="mb-8">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Common Exam Questions
          </h2>
          <div className="space-y-3">
            {topic.examQuestions.map((question, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <p className="text-sm leading-relaxed">{question}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <Button
            variant="outline"
            className="mt-4 text-sm"
            onClick={() => navigate(tutorUrl)}
          >
            Practice answering these with AI feedback
          </Button>
        </section>

        {/* FAQ */}
        <section className="mb-8">
          <h2 className="text-xl font-bold mb-4">Frequently Asked Questions</h2>
          <Accordion type="single" collapsible className="w-full">
            {topic.faqs.map((faq, i) => (
              <AccordionItem key={i} value={`faq-${i}`}>
                <AccordionTrigger className="text-sm font-medium text-left">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>

        {/* Related Topics */}
        {relatedTopics.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xl font-bold mb-4">Related Topics</h2>
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
              {relatedTopics.map((related) => (
                <Link key={related.slug} to={`/revision/${related.slug}`}>
                  <Card className="hover:border-primary/50 transition-colors">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{related.topic}</p>
                        <p className="text-xs text-muted-foreground">
                          {related.examBoard} {related.subject}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Bottom CTA */}
        <section className="text-center py-8 border-t border-border">
          <h2 className="text-2xl font-bold mb-2">Ready to revise {topic.topic}?</h2>
          <p className="text-muted-foreground mb-6 text-sm">
            Get AI-powered tutoring tailored to the {topic.examBoard} {topic.subject} specification.
          </p>
          <div className="flex gap-3 justify-center">
            <Button variant="brand" className="rounded-full" onClick={() => navigate(tutorUrl)}>
              Start Free
            </Button>
            <Button variant="outline" className="rounded-full" onClick={() => navigate("/compare")}>
              View Plans
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
};
