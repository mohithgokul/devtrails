import { useState } from 'react';
import { OnboardingData } from '@/hooks/useOnboarding';
import { User, Phone, Camera, Mail, Lock } from 'lucide-react';

interface Props {
  data: OnboardingData;
  updateData: (d: Partial<OnboardingData>) => void;
}

const StepBasicInfo = ({ data, updateData }: Props) => {
  return (
    <div className="space-y-5 animate-slide-left">
      <div>
        <h2 className="text-xl font-bold text-foreground">Let's get to know you</h2>
        <p className="text-sm text-muted-foreground mt-1">Basic details to set up your account</p>
      </div>

      {/* Profile Photo */}
      <div className="flex justify-center">
        <label className="relative cursor-pointer group">
          <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center border-2 border-dashed border-primary/30 group-hover:border-primary transition-colors overflow-hidden">
            {data.profilePhoto ? (
              <img src={data.profilePhoto} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <Camera className="w-8 h-8 text-muted-foreground" />
            )}
          </div>
          <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full gradient-primary flex items-center justify-center shadow-md">
            <Camera className="w-4 h-4 text-primary-foreground" />
          </div>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                const reader = new FileReader();
                reader.onload = () => updateData({ profilePhoto: reader.result as string });
                reader.readAsDataURL(file);
              }
            }}
          />
        </label>
      </div>

      {/* Full Name */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground">Full Name</label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Enter your full name"
            value={data.fullName}
            onChange={(e) => updateData({ fullName: e.target.value })}
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-muted/50 border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm"
          />
        </div>
      </div>

      {/* Email */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground">Email Address</label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="email"
            placeholder="you@example.com"
            value={data.email}
            onChange={(e) => updateData({ email: e.target.value })}
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-muted/50 border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm"
          />
        </div>
      </div>

      {/* Password */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground">Create Password</label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="password"
            placeholder="Minimum 6 characters"
            value={data.password}
            onChange={(e) => updateData({ password: e.target.value })}
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-muted/50 border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm"
          />
        </div>
      </div>

      {/* Phone */}
      <div className="space-y-1.5 pb-4">
        <label className="text-sm font-medium text-foreground">Phone Number</label>
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="tel"
            placeholder="10-digit mobile number"
            value={data.phone}
            onChange={(e) => updateData({ phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-muted/50 border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm"
          />
        </div>
      </div>
    </div>
  );
};

export default StepBasicInfo;
