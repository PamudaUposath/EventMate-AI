import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Calendar,
  MapPin,
  Users,
  DollarSign,
  Clock,
  Layers,
  HelpCircle,
} from 'lucide-react';
import { api } from '../services/api';

const createEventWizardSchema = z.object({
  title: z.string().min(3, 'Event title must be at least 3 characters'),
  type: z.string().min(2, 'Please specify an event type'),
  format: z.enum(['in-person', 'online', 'hybrid']),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Valid date required (YYYY-MM-DD)'),
  location: z.string().min(2, 'Location or platform is required'),
  participants: z.coerce.number().min(1, 'At least 1 attendee expected'),
  budget: z.coerce.number().min(0, 'Budget cannot be negative'),
  currency: z.string().default('LKR'),
  duration: z.string().min(1, 'Duration is required'),
  additionalRequirements: z.string().optional(),
});

type CreateEventFormData = z.infer<typeof createEventWizardSchema>;

export const CreateEventPage: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Building your preparation checklist...');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    watch,
    trigger,
    formState: { errors },
  } = useForm<CreateEventFormData>({
    resolver: zodResolver(createEventWizardSchema),
    defaultValues: {
      title: 'AWS Cloud Hands-on Workshop 2026',
      type: 'technical-workshop',
      format: 'in-person',
      date: '2026-11-20',
      location: 'Colombo Innovation Hub, Lab 3',
      participants: 100,
      budget: 25000,
      currency: 'LKR',
      duration: '4 hours',
      additionalRequirements: 'Attendees bring laptops. Projector, dual mics, and fast Wi-Fi required.',
    },
  });

  const formData = watch();

  const handleNext = async () => {
    let valid = false;
    if (currentStep === 1) {
      valid = await trigger(['title', 'type']);
    } else if (currentStep === 2) {
      valid = await trigger(['date', 'format', 'location']);
    } else if (currentStep === 3) {
      valid = await trigger(['participants', 'budget', 'currency', 'duration']);
    }
    if (valid) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(1, prev - 1));
  };

  const onSubmit = async (data: CreateEventFormData) => {
    setIsSubmitting(true);
    setErrorMsg(null);
    setLoadingMessage('Initializing event workspace with AI...');

    try {
      setTimeout(() => {
        setLoadingMessage('Generating tailored milestone checklist...');
      }, 700);

      const created = await api.createEvent(data);
      navigate(`/events/${created.eventId}`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create event. Please verify your details.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-8">
      {/* Step Indicator Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/30 text-xs font-semibold text-brand-300">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Step-by-Step Co-Organiser Setup</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Plan Your Next Event
        </h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Answer a few quick questions. If you don't know exact details yet, we'll start with reasonable assumptions!
        </p>
      </div>

      {/* Stepper Progress Bar */}
      <div className="flex items-center justify-between px-2">
        {[
          { step: 1, label: 'Event Details' },
          { step: 2, label: 'When & Where' },
          { step: 3, label: 'Scale & Budget' },
          { step: 4, label: 'Review & Plan' },
        ].map((item) => (
          <div key={item.step} className="flex flex-col items-center flex-1">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                currentStep >= item.step
                  ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20'
                  : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}
            >
              {currentStep > item.step ? <CheckCircle2 className="w-4 h-4" /> : item.step}
            </div>
            <span
              className={`text-[11px] mt-1 hidden sm:block ${
                currentStep >= item.step ? 'text-white font-medium' : 'text-slate-500'
              }`}
            >
              {item.label}
            </span>
          </div>
        ))}
      </div>

      {/* Main Wizard Form Card */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-2xl relative">
        {isSubmitting ? (
          <div className="py-16 text-center space-y-4">
            <div className="w-12 h-12 border-3 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">{loadingMessage}</h3>
              <p className="text-xs text-slate-400">
                Setting up real DynamoDB tasks and Bedrock conversational memory...
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                {errorMsg}
              </div>
            )}

            {/* STEP 1: What are you organising? */}
            {currentStep === 1 && (
              <div className="space-y-4 animate-fadeIn">
                <div className="space-y-1">
                  <h2 className="text-lg font-bold text-white">What are you organising?</h2>
                  <p className="text-xs text-slate-400">
                    Give your event a clear title and choose a category.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Event Title *
                  </label>
                  <input
                    {...register('title')}
                    placeholder="e.g. AWS Cloud Hands-on Workshop 2026"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
                  />
                  {errors.title && (
                    <p className="text-xs text-rose-400 mt-1">{errors.title.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Event Type *
                  </label>
                  <select
                    {...register('type')}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500"
                  >
                    <option value="technical-workshop">Technical Workshop / Hands-on Lab</option>
                    <option value="hackathon">Hackathon / Coding Competition</option>
                    <option value="meetup">Community Meetup / Networking</option>
                    <option value="seminar">Seminar / Guest Lecture</option>
                    <option value="volunteer-drive">Volunteer / Club Activity</option>
                  </select>
                  {errors.type && (
                    <p className="text-xs text-rose-400 mt-1">{errors.type.message}</p>
                  )}
                </div>
              </div>
            )}

            {/* STEP 2: When and where will it happen? */}
            {currentStep === 2 && (
              <div className="space-y-4 animate-fadeIn">
                <div className="space-y-1">
                  <h2 className="text-lg font-bold text-white">When and where will it happen?</h2>
                  <p className="text-xs text-slate-400">
                    Specify the date and venue so EventMate can calculate preparation timelines.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Target Date *
                    </label>
                    <input
                      type="date"
                      {...register('date')}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500"
                    />
                    {errors.date && (
                      <p className="text-xs text-rose-400 mt-1">{errors.date.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Event Format *
                    </label>
                    <select
                      {...register('format')}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500"
                    >
                      <option value="in-person">In-Person (Campus / Venue)</option>
                      <option value="online">Online (Zoom / Amazon Chime)</option>
                      <option value="hybrid">Hybrid</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Location / Platform *
                  </label>
                  <input
                    {...register('location')}
                    placeholder="e.g. Colombo Innovation Hub, Lab 3"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
                  />
                  {errors.location && (
                    <p className="text-xs text-rose-400 mt-1">{errors.location.message}</p>
                  )}
                </div>
              </div>
            )}

            {/* STEP 3: How many people & budget? */}
            {currentStep === 3 && (
              <div className="space-y-4 animate-fadeIn">
                <div className="space-y-1">
                  <h2 className="text-lg font-bold text-white">Scale, Duration & Budget</h2>
                  <p className="text-xs text-slate-400">
                    Helps EventMate allocate realistic catering, tech, and venue suggestions.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Expected Participants *
                    </label>
                    <input
                      type="number"
                      {...register('participants')}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500"
                    />
                    {errors.participants && (
                      <p className="text-xs text-rose-400 mt-1">{errors.participants.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Event Duration *
                    </label>
                    <input
                      {...register('duration')}
                      placeholder="e.g. 4 hours"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500"
                    />
                    {errors.duration && (
                      <p className="text-xs text-rose-400 mt-1">{errors.duration.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Total Allocated Budget *
                    </label>
                    <input
                      type="number"
                      {...register('budget')}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500"
                    />
                    {errors.budget && (
                      <p className="text-xs text-rose-400 mt-1">{errors.budget.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Currency
                    </label>
                    <input
                      {...register('currency')}
                      placeholder="LKR"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Special Requirements (Optional)
                  </label>
                  <textarea
                    {...register('additionalRequirements')}
                    rows={2}
                    placeholder="e.g. AWS sandboxes needed, projector, dual mics..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 resize-none"
                  />
                </div>
              </div>
            )}

            {/* STEP 4: Review & Generate */}
            {currentStep === 4 && (
              <div className="space-y-4 animate-fadeIn">
                <div className="space-y-1">
                  <h2 className="text-lg font-bold text-white">Review Your Event Plan</h2>
                  <p className="text-xs text-slate-400">
                    Review your inputs. EventMate AI will generate your initial checklist and timeline.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3 text-xs">
                  <div className="flex justify-between border-b border-slate-800 pb-2">
                    <span className="text-slate-400 font-medium">Event Title</span>
                    <span className="text-white font-semibold">{formData.title}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800 pb-2">
                    <span className="text-slate-400 font-medium">Category</span>
                    <span className="text-brand-300 capitalize">{formData.type}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800 pb-2">
                    <span className="text-slate-400 font-medium">Date & Format</span>
                    <span className="text-white">
                      {formData.date} • {formData.format}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800 pb-2">
                    <span className="text-slate-400 font-medium">Location</span>
                    <span className="text-white">{formData.location}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800 pb-2">
                    <span className="text-slate-400 font-medium">Scale & Budget</span>
                    <span className="text-white">
                      {formData.participants} attendees • {formData.currency} {formData.budget?.toLocaleString()}
                    </span>
                  </div>
                  {formData.additionalRequirements && (
                    <div className="pt-1">
                      <span className="text-slate-400 font-medium block mb-1">Special Requirements:</span>
                      <p className="text-slate-300 italic">{formData.additionalRequirements}</p>
                    </div>
                  )}
                </div>

                <div className="p-3.5 rounded-xl bg-brand-500/10 border border-brand-500/20 text-xs text-brand-300 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 shrink-0 text-brand-400" />
                  <span>
                    Upon confirmation, EventMate will save your event and generate customized preparation tasks in DynamoDB.
                  </span>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
              {currentStep > 1 ? (
                <button
                  type="button"
                  onClick={handleBack}
                  className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>
              ) : (
                <div />
              )}

              {currentStep < 4 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-6 py-2.5 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-500 rounded-xl transition-colors flex items-center gap-1.5 shadow-md shadow-brand-600/20"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  type="submit"
                  className="px-7 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-brand-600/25"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Event Plan with AI</span>
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
