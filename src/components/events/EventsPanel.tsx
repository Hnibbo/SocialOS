import { useState, useEffect, useRef } from 'react';
import { MapPin, Navigation, Calendar, Clock, Users, Filter, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/lib/supabase';
import { formatDistanceToNow, format } from 'date-fns';

interface Event {
  id: string;
  title: string;
  description: string;
  location_name: string;
  address: string;
  latitude: number;
  longitude: number;
  start_time: string;
  end_time: string;
  is_virtual: boolean;
  max_attendees: number;
  current_attendees: number;
  category: string;
  tags: string[];
  cover_image?: string;
  price?: number;
  organizer: {
    id: string;
    username: string;
    avatar_url?: string;
  };
  attendance?: {
    id: string;
    status: 'going' | 'interested' | 'not_going';
    joined_at: string;
  };
}

interface EventsPanelProps {
  onCreateEvent?: () => void;
}

export default function EventsPanel({ onCreateEvent }: EventsPanelProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTime, setSelectedTime] = useState('upcoming');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);

  const categories = [
    { value: 'all', label: 'All Events' },
    { value: 'social', label: 'Social' },
    { value: 'professional', label: 'Professional' },
    { value: 'entertainment', label: 'Entertainment' },
    { value: 'sports', label: 'Sports' },
    { value: 'education', label: 'Education' },
    { value: 'wellness', label: 'Wellness' },
    { value: 'charity', label: 'Charity' },
  ];

  const timeFilters = [
    { value: 'upcoming', label: 'Upcoming' },
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'past', label: 'Past Events' },
  ];

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    let filtered = events;

    if (searchQuery) {
      filtered = filtered.filter(event =>
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.location_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(event => event.category === selectedCategory);
    }

    if (selectedTime !== 'upcoming' && selectedTime !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      filtered = filtered.filter(event => {
        const eventDate = new Date(event.start_time);
        switch (selectedTime) {
          case 'today':
            return eventDate.toDateString() === today.toDateString();
          case 'week':
            return eventDate >= weekStart && eventDate <= weekEnd;
          case 'month':
            return eventDate >= monthStart && eventDate <= monthEnd;
          case 'past':
            return eventDate < today;
          default:
            return eventDate >= today;
        }
      });
    }

    setFilteredEvents(filtered);
  }, [events, searchQuery, selectedCategory, selectedTime]);

  const fetchEvents = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          organizer:profiles!events_organizer_id_fkey(id, username, avatar_url),
          attendance:event_attendees(id, status, joined_at)
        `)
        .or(`private.eq.false, attendance.user_id.eq.${user.id}`)
        .order('start_time', { ascending: true });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const rsvpEvent = async (eventId: string, status: 'going' | 'interested' | 'not_going') => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('event_attendees')
        .upsert({
          event_id: eventId,
          user_id: user.id,
          status
        });

      if (error) throw error;

      if (status === 'going') {
        await supabase.rpc('increment_event_attendees', { event_id: eventId });
      } else {
        await supabase.rpc('decrement_event_attendees', { event_id: eventId });
      }

      fetchEvents();
    } catch (error) {
      console.error('Error RSVPing to event:', error);
    }
  };

  const getDirections = (event: Event) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${event.latitude},${event.longitude}`;
    window.open(url, '_blank');
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Events</h2>
        <Button onClick={onCreateEvent} className="bg-gradient-to-r from-blue-500 to-purple-600">
          <Calendar className="h-4 w-4 mr-2" />
          Create Event
        </Button>
      </div>

      <div className="flex flex-col gap-4 md:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex gap-2">
          <div className="flex gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border rounded-md bg-background"
            >
              {categories.map(category => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
            
            <select
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
              className="px-3 py-2 border rounded-md bg-background"
            >
              {timeFilters.map(filter => (
                <option key={filter.value} value={filter.value}>
                  {filter.label}
                </option>
              ))}
            </select>
          </div>
          
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredEvents.map((event) => (
          <Card key={event.id} className="group hover:shadow-lg transition-all duration-200">
            {event.cover_image && (
              <div className="h-48 bg-cover bg-center relative overflow-hidden rounded-t-lg">
                <img 
                  src={event.cover_image} 
                  alt={event.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-2 left-2 text-white">
                  <Badge variant="secondary" className="bg-black/50 text-white">
                    {event.category}
                  </Badge>
                </div>
              </div>
            )}
            
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg line-clamp-2">{event.title}</CardTitle>
                  <CardDescription className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {format(new Date(event.start_time), 'MMM d, h:mm a')}
                  </CardDescription>
                  <CardDescription className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {event.is_virtual ? 'Virtual Event' : event.location_name}
                  </CardDescription>
                  <CardDescription className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {event.current_attendees}/{event.max_attendees}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                {event.description}
              </p>
              
              <div className="flex flex-wrap gap-1 mb-4">
                {event.tags.map((tag, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
              
              <div className="flex items-center gap-2 mb-4">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={event.organizer.avatar_url} alt={event.organizer.username} />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs">
                    {event.organizer.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm text-muted-foreground">
                  by {event.organizer.username}
                </span>
                {event.price && (
                  <Badge variant="secondary" className="ml-auto">
                    ${event.price}
                  </Badge>
                )}
              </div>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setSelectedEvent(event)}
                >
                  View Details
                </Button>
                
                {event.attendance ? (
                  <select
                    value={event.attendance.status}
                    onChange={(e) => rsvpEvent(event.id, e.target.value as any)}
                    className="px-2 py-1 text-sm border rounded"
                  >
                    <option value="going">Going</option>
                    <option value="interested">Interested</option>
                    <option value="not_going">Not Going</option>
                  </select>
                ) : (
                  <Button 
                    className="bg-gradient-to-r from-blue-500 to-purple-600"
                    size="sm"
                    onClick={() => rsvpEvent(event.id, 'going')}
                  >
                    RSVP
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredEvents.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No events found</h3>
          <p className="text-muted-foreground mb-4">
            Try adjusting your search or filters, or create a new event.
          </p>
          <Button onClick={onCreateEvent} className="bg-gradient-to-r from-blue-500 to-purple-600">
            <Calendar className="h-4 w-4 mr-2" />
            Create First Event
          </Button>
        </div>
      )}

      {selectedEvent && (
        <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedEvent.title}</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              {selectedEvent.cover_image && (
                <div className="h-64 bg-cover bg-center rounded-lg overflow-hidden">
                  <img 
                    src={selectedEvent.cover_image} 
                    alt={selectedEvent.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <h3 className="font-semibold">Event Details</h3>
                  <div className="space-y-2">
                    <p className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      {format(new Date(selectedEvent.start_time), 'EEEE, MMMM d, yyyy')}
                    </p>
                    <p className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      {format(new Date(selectedEvent.start_time), 'h:mm a')} - 
                      {format(new Date(selectedEvent.end_time), 'h:mm a')}
                    </p>
                    <p className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      {selectedEvent.is_virtual ? 'Virtual Event' : selectedEvent.location_name}
                    </p>
                    {!selectedEvent.is_virtual && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => getDirections(selectedEvent)}
                      >
                        <Navigation className="h-4 w-4 mr-2" />
                        Get Directions
                      </Button>
                    )}
                    <p className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      {selectedEvent.current_attendees} / {selectedEvent.max_attendees} attending
                    </p>
                    {selectedEvent.price && (
                      <p className="font-semibold">
                        Ticket Price: ${selectedEvent.price}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="font-semibold">Organizer</h3>
                  <div className="flex items-center gap-3">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={selectedEvent.organizer.avatar_url} alt={selectedEvent.organizer.username} />
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                        {selectedEvent.organizer.username.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">{selectedEvent.organizer.username}</p>
                      <p className="text-sm text-muted-foreground">Event Organizer</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-muted-foreground">{selectedEvent.description}</p>
              </div>
              
              <div className="flex flex-wrap gap-1">
                {selectedEvent.tags.map((tag, index) => (
                  <Badge key={index} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}