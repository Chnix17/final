import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog } from '@headlessui/react';
import axios from 'axios';
import { format, isSameDay } from 'date-fns';
import { toast } from 'react-toastify';
import { DatePicker, TimePicker, Spin } from 'antd';
import dayjs from 'dayjs';
import { isHoliday } from './holiday_utils';
import { HolidaysAPI } from '../../api/holidaysAPI';

// Update the availabilityStatus object with more sophisticated styling
const availabilityStatus = {
  past: {
    className: 'bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/80 dark:to-gray-800/90 opacity-60',
    hoverClass: 'cursor-not-allowed select-none',
    textClass: 'text-gray-400 dark:text-gray-500 line-through'
  },
  available: {
    className: 'bg-gradient-to-br from-emerald-50 to-green-100 dark:from-emerald-900/20 dark:to-green-900/30',
    hoverClass: 'hover:shadow-lg hover:scale-[1.02] hover:z-10 transition-all duration-200 cursor-pointer',
    textClass: 'text-emerald-800 dark:text-emerald-300'
  },
  partial: {
    className: 'bg-gradient-to-br from-amber-50 to-yellow-100 dark:from-amber-900/20 dark:to-yellow-900/30',
    hoverClass: 'hover:shadow-lg hover:scale-[1.02] hover:z-10 transition-all duration-200 cursor-pointer',
    textClass: 'text-amber-800 dark:text-amber-300'
  },
  reserved: {
    className: 'bg-gradient-to-br from-rose-50 to-red-100 dark:from-rose-900/20 dark:to-red-900/30',
    hoverClass: 'cursor-not-allowed select-none',
    textClass: 'text-rose-800 dark:text-rose-300'
  },
  holiday: {
    className: 'bg-gradient-to-br from-purple-50 to-violet-100 dark:from-purple-900/20 dark:to-violet-900/30',
    hoverClass: 'cursor-not-allowed select-none',
    textClass: 'text-purple-800 dark:text-violet-300'
  }
};

const ReservationCalendar = ({ onDateSelect, selectedResource }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedStartDate, setSelectedStartDate] = useState(null);
  const [selectedEndDate, setSelectedEndDate] = useState(null);
  const [reservations, setReservations] = useState([]);
  const [view, setView] = useState('month');
  const [timeModalOpen, setTimeModalOpen] = useState(false);
  const [selectedTimes, setSelectedTimes] = useState({
    startTime: null,
    endTime: null,
    startMinute: null,
    endMinute: null
  });
  const [dateRange, setDateRange] = useState(null);
  const [setDateTimeValidation] = useState({
    isValid: true,
    message: ''
  });

  const [isLoading, setIsLoading] = useState(false);

  const [isSelectionComplete] = useState(false);

  const [conflictDetails, setConflictDetails] = useState(null);
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [isDatePickerModalOpen, setIsDatePickerModalOpen] = useState(false);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null); // Add this line
  const [holidays, setHolidays] = useState([]);

  // Add this new state
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);

  // Add these new state variables after other state declarations
  const [selectionMode, setSelectionMode] = useState('full'); // 'full' for monthly, 'end-only' for weekly/daily

  // Add this function after the state declarations and before other functions
  const isSelectionValid = () => {
    if (selectionMode === 'full') {
      return (
        selectedStartDate && 
        selectedEndDate && 
        selectedTimes.startTime !== null && 
        selectedTimes.endTime !== null &&
        selectedTimes.startTime >= 5 &&
        selectedTimes.endTime <= 19
      );
    } else {
      return (
        selectedStartDate && 
        selectedEndDate &&
        selectedTimes.endTime !== null &&
        selectedTimes.endTime <= 19
      );
    }
  };

  // Add this function right after the state declarations
  const getReservedTimeSlots = (date) => {
    if (!date) return { hours: [], timeRanges: [] };
    
    const timeRanges = [];
    const reservedHours = new Set();
    
    const dayReservations = reservations.filter(res => 
      res.isReserved && isSameDay(new Date(res.startDate), date)
    );
  
    dayReservations.forEach(res => {
      const start = new Date(res.startDate);
      const end = new Date(res.endDate);
      timeRanges.push({
        start: start,
        end: end
      });
      
      // Add all hours within the reservation
      for (let hour = start.getHours(); hour <= end.getHours(); hour++) {
        reservedHours.add(hour);
      }
    });
  
    return {
      hours: Array.from(reservedHours),
      timeRanges: timeRanges
    };
  };

  useEffect(() => {
    fetchReservations();
  }, [selectedResource]);

  // Add this useEffect to fetch holidays
  useEffect(() => {
    const loadHolidays = async () => {
      try {
        const currentYear = new Date().getFullYear();
        console.log('Fetching holidays for year:', currentYear);
        const holidaysList = await HolidaysAPI.fetchHolidays(currentYear);
        console.log('Fetched holidays:', holidaysList);
        setHolidays(holidaysList);
      } catch (error) {
        console.error('Failed to load holidays:', error);
        toast.error('Failed to load holiday information');
      }
    };
    loadHolidays();
  }, []);

  const fetchReservations = async () => {
    setIsLoading(true);
    try {
      // Ensure selectedResource.id is treated as an array
      const itemIds = Array.isArray(selectedResource.id) ? selectedResource.id : [selectedResource.id];
      
      const response = await axios.post(
        'http://localhost/coc/gsd/user.php',
        {
          operation: 'fetchAvailability',
          itemType: selectedResource.type,
          itemId: itemIds
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
  
      if (response.data.status === 'success') {
        const formattedReservations = response.data.data.map(res => ({
          id: res.reservation_form_venue_id || res.reservation_form_vehicle_id,
          startDate: new Date(res.reservation_start_date),
          endDate: new Date(res.reservation_end_date),
          status: res.reservation_status_status_id,
          isReserved: res.reservation_status_status_id === '6',
          venueName: res.ven_name // Store venue name
        }));
        setReservations(formattedReservations);
      }
    } catch (error) {
      toast.error('Failed to fetch reservations');
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const isDateReserved = (date) => {
    return reservations.some(res => {
      if (!res.isReserved) return false;
      
      const resStart = new Date(res.startDate);
      const resEnd = new Date(res.endDate);
      const current = new Date(date);
      
      // Set all dates to midnight for proper day comparison
      current.setHours(0, 0, 0, 0);
      const startDay = new Date(resStart).setHours(0, 0, 0, 0);
      const endDay = new Date(resEnd).setHours(0, 0, 0, 0);
  
      return current >= startDay && current <= endDay;
    });
  };


  const handleDateClick = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);
    
    if (compareDate < today) {
      toast.error('Cannot select past dates');
      return;
    }
  
    const status = getAvailabilityStatus(date, reservations);
    const holidayInfo = holidays.find(h => h.date === date.toISOString().split('T')[0]);
  
    if (status === 'reserved') {
      toast.error('This date is already fully reserved');
      return;
    }
    
    if (holidayInfo) {
      toast.error(`Reservations not allowed on ${holidayInfo.name}`);
      return;
    }
  
    // Set the selected start date and open modal
    setSelectedStartDate(date);
    setStartDate(date);
    setEndDate(null);
    setSelectedEndDate(null);
    setIsDatePickerModalOpen(true);
  };

  const handleDateNavigation = (direction) => {
    const newDate = new Date(currentDate);
    if (view === 'month') {
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
    } else if (view === 'week') {
      if (direction === 'prev') {
        newDate.setDate(newDate.getDate() - 7);
      } else {
        newDate.setDate(newDate.getDate() + 7);
      }
    } else {
      if (direction === 'prev') {
        newDate.setDate(newDate.getDate() - 1);
      } else {
        newDate.setDate(newDate.getDate() + 1);
      }
    }
    setCurrentDate(newDate);
  };

  const handleReservationClick = (reservation) => {
    // Implement if needed
    console.log('Reservation clicked:', reservation);
  };

// First, update the getAvailabilityStatus function to always return one of our defined statuses
const getAvailabilityStatus = (date, allReservations) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const compareDate = new Date(date);
  compareDate.setHours(0, 0, 0, 0);
  
  // Past dates check
  if (compareDate < today) {
    return 'past';
  }

  // Check for holidays
  const formattedDate = compareDate.toISOString().split('T')[0];
  if (holidays.find(h => h.date === formattedDate)) {
    return 'holiday';
  }

  // If there are no reservations, the date is fully available
  if (!allReservations.length) {
    return 'available';
  }

  // Group reservations by venue for the current date
  const venueReservations = new Map();
  
  allReservations.forEach(res => {
    if (!res.isReserved) return;

    const resStart = new Date(res.startDate);
    const resEnd = new Date(res.endDate);
    resStart.setHours(0, 0, 0, 0);
    resEnd.setHours(23, 59, 59, 999);
    
    if (compareDate >= resStart && compareDate <= resEnd) {
      if (!venueReservations.has(res.venueName)) {
        venueReservations.set(res.venueName, []);
      }
      venueReservations.get(res.venueName).push({
        ...res,
        startHour: new Date(res.startDate).getHours(),
        endHour: new Date(res.endDate).getHours()
      });
    }
  });

  // Check for full-day reservations (5AM to 7PM)
  const hasFullDayReservation = Array.from(venueReservations.values()).some(venueRes => 
    venueRes.some(res => 
      res.startHour <= 5 && res.endHour >= 19
    )
  );

  // If any venue has a full-day reservation, mark as reserved
  if (hasFullDayReservation) {
    return 'reserved';
  }

  // Check if there are any partial reservations
  const hasPartialReservations = venueReservations.size > 0;

  return hasPartialReservations ? 'partial' : 'available';
};

// Add new function to get business hours status
const getBusinessHoursStatus = (date) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const compareDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  
  if (compareDate < today) return 'past';
  if (compareDate.getTime() === today.getTime()) {
    const currentHour = now.getHours();
    if (currentHour >= 19) return 'past'; // After business hours
    if (currentHour < 5) return 'upcoming'; // Before business hours
    return 'current';
  }
  return 'upcoming';
};

// Then update the renderCalendarGrid function to handle the status more safely
const renderCalendarGrid = () => {
  const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  
  const days = [];
  const startDay = startOfMonth.getDay();
  const totalDays = endOfMonth.getDate();
  
  // Add previous month's days
  for (let i = 0; i < startDay; i++) {
    const prevDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), -i);
    days.unshift(prevDate);
  }
  
  // Add current month's days
  for (let i = 1; i <= totalDays; i++) {
    days.push(new Date(currentDate.getFullYear(), currentDate.getMonth(), i));
  }
  
  // Add next month's days to complete the grid
  const remainingDays = 42 - days.length; // 6 rows × 7 days
  for (let i = 1; i <= remainingDays; i++) {
    days.push(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, i));
  }

  return (
    <motion.div className="grid grid-cols-7 gap-1 sm:gap-2">
      {days.map((day, index) => {
        const isCurrentMonth = day.getMonth() === currentDate.getMonth();
        // Format the date consistently for comparison
        const formattedDate = new Date(
          day.getFullYear(),
          day.getMonth(),
          day.getDate()
        ).toISOString().split('T')[0];
        const holidayInfo = holidays.find(h => h.date === formattedDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const compareDate = new Date(day);
        compareDate.setHours(0, 0, 0, 0);
        
        // Check if the date is in the past or today but after business hours
        const isPastDate = compareDate < today;
        
        // Determine the style based on date status


        // Add selected date range highlighting
        const isSelected = selectedStartDate && day >= selectedStartDate && 
                         (selectedEndDate ? day <= selectedEndDate : day === selectedStartDate);

        const businessHoursStatus = getBusinessHoursStatus(day);
        const status = businessHoursStatus === 'past' ? 'past' : getAvailabilityStatus(day, reservations);
        const statusStyle = availabilityStatus[status];
        
        // Enhanced cell content
        return (
          <motion.div
            key={day.toISOString()}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2, delay: index * 0.01 }}
            onClick={() => handleDateClick(day, status)}
            className={`
              relative min-h-[60px] sm:min-h-[100px] p-2 sm:p-3
              border dark:border-gray-700/50 rounded-xl
              backdrop-blur-sm
              ${isCurrentMonth ? statusStyle.className : 'opacity-40'}
              ${statusStyle.hoverClass}
              ${isSelected ? 'ring-2 ring-blue-500 dark:ring-blue-400' : ''}
              transition-all duration-200
              ${isSameDay(day, new Date()) ? 'ring-2 ring-blue-500 dark:ring-blue-400 ring-offset-2 dark:ring-offset-gray-900' : ''}
            `}
          >
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between mb-2">
                <span className={`
                  text-sm sm:text-base font-semibold
                  ${isCurrentMonth ? statusStyle.textClass : 'text-gray-400'}
                  ${isSameDay(day, new Date()) ? '!text-blue-600 dark:!text-blue-400' : ''}
                `}>
                  {format(day, 'd')}
                </span>
                {holidayInfo && (
                  <span className="text-[8px] sm:text-xs px-2 py-0.5 rounded-full 
                                 bg-violet-100 dark:bg-violet-900/30 text-violet-800 dark:text-violet-300
                                 font-medium truncate max-w-[80px]">
                    {holidayInfo.name.split(' ')[0]}
                  </span>
                )}
              </div>
              
              {/* Enhanced time slot indicators */}
              {isCurrentMonth && status !== 'past' && (
                <div className="mt-1 space-y-1">
                  {getReservedTimeSlots(day).timeRanges.map((range, idx) => (
                    <div
                      key={idx}
                      className="text-[8px] sm:text-xs py-0.5 px-1.5 rounded-md
                               bg-gray-100 dark:bg-gray-800/60
                               text-gray-600 dark:text-gray-400"
                      title={`${format(range.start, 'HH:mm')} - ${format(range.end, 'HH:mm')}`}
                    >
                      {format(range.start, 'HH:mm')} - {format(range.end, 'HH:mm')}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Enhanced status indicator */}
            <div className="absolute bottom-2 right-2">
              <div className={`
                w-2 h-2 rounded-full
                ${status === 'available' ? 'bg-emerald-400 animate-pulse' : ''}
                ${status === 'partial' ? 'bg-amber-400' : ''}
                ${status === 'reserved' ? 'bg-rose-400' : ''}
                ${status === 'holiday' ? 'bg-violet-400' : ''}
              `}/>
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
};

// Update the getTimeSlotAvailability function to handle multi-day reservations
const getTimeSlotAvailability = (date, hour, allReservations) => {
  // Business hours are 5 AM to 7 PM
  if (hour < 5 || hour >= 19) return 'outside';

  const slotStart = new Date(date);
  slotStart.setHours(hour, 0, 0, 0); // Start of the time slot
  const slotEnd = new Date(date);
  slotEnd.setHours(hour + 1, 0, 0, 0); // End of the time slot

  // Check if the time slot overlaps with any reservation
  const hasReservation = allReservations.some(res => {
    if (!res.isReserved) return false;

    const resStart = new Date(res.reservation_form_start_date);
    const resEnd = new Date(res.reservation_form_end_date);

    // Handle multi-day reservations
    if (!isSameDay(resStart, resEnd)) {
      if (isSameDay(date, resStart)) {
        if (slotStart >= resStart && slotStart < resEnd) {
          return true;
        }
      }

      if (isSameDay(date, resEnd)) {
        if (slotEnd > resStart && slotEnd <= resEnd) {
          return true;
        }
      }
      if (date > resStart && date < resEnd) {
        return true;
      }
    } else {
      if (slotStart < resEnd && slotEnd > resStart) {
        return true;
      }
    }

    return false;
  });

  return hasReservation ? 'reserved' : 'available';
};


// Update the renderWeekView function
const renderWeekView = () => {
  const startOfWeek = new Date(currentDate);
  startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
  const days = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(startOfWeek);
    day.setDate(startOfWeek.getDate() + i);
    return day;
  });

  const timeSlots = Array.from({ length: 14 }, (_, i) => i + 5); // This will create an array from 5 to 18 (5 AM to 6 PM)
 // Show all hours
  const now = new Date();

  return (
    <div className="overflow-x-auto">
      <div className="min-w-full bg-white dark:bg-gray-900 rounded-xl shadow-sm">
        <div className="grid grid-cols-[80px_repeat(7,1fr)] border-b dark:border-gray-700/50">
          <div className="p-3 text-sm font-medium text-gray-500">Time</div>
          {days.map((day) => {
            const isToday = isSameDay(day, new Date());
            const isPast = day < new Date(now.setHours(0, 0, 0, 0));
            const holidayInfo = holidays.find(h => h.date === day.toISOString().split('T')[0]);

            return (
              <div 
                key={day.toISOString()} 
                className={`
                  p-3 text-center border-l dark:border-gray-700/50
                  ${isToday ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
                  ${isPast ? 'bg-gray-50 dark:bg-gray-800/50' : ''}
                  ${holidayInfo ? 'bg-violet-50 dark:bg-violet-900/20' : ''}
                `}
              >
                <div className="text-sm font-semibold">{format(day, 'EEE')}</div>
                <div className="text-xs text-gray-500 mt-1">{format(day, 'MMM d')}</div>
                {holidayInfo && (
                  <div className="text-[10px] text-violet-600 dark:text-violet-400 mt-1 truncate">
                    {holidayInfo.name.split(' ')[0]}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {timeSlots.map((hour) => (
          <div 
            key={hour} 
            className="grid grid-cols-[80px_repeat(7,1fr)] border-b dark:border-gray-700/50 last:border-b-0"
          >
            <div className="p-3 text-sm font-medium text-gray-500 bg-gray-50 dark:bg-gray-800/30">
              {format(new Date().setHours(hour), 'ha')}
            </div>
            {days.map((day) => {
              const conflicts = checkTimeSlotConflicts(day, hour);
              const isReserved = conflicts.length > 0;
              const isPast = new Date(day.setHours(hour)) < now;
              const holidayInfo = holidays.find(h => h.date === day.toISOString().split('T')[0]);

              return (
                <motion.div
                  key={`${day.toISOString()}-${hour}`}
                  whileHover={!isPast && !isReserved && !holidayInfo ? { scale: 1.02 } : {}}
                  className={`
                    p-3 border-l dark:border-gray-700/50 min-h-[60px] relative
                    transition-colors duration-200
                    ${isReserved ? 'bg-rose-50 dark:bg-rose-900/20' : ''}
                    ${!isReserved && !isPast && !holidayInfo ? 'bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/10 cursor-pointer' : ''}
                    ${isPast ? 'bg-gray-50 dark:bg-gray-800/50' : ''}
                    ${holidayInfo ? 'bg-violet-50 dark:bg-violet-900/20' : ''}
                  `}
                  onClick={() => !isPast && !isReserved && !holidayInfo && handleTimeSlotClick(day, hour)}
                >
                  {isReserved && conflicts.map((conflict, idx) => (
                    <div key={idx} className="text-[10px] text-rose-600 dark:text-rose-400 mb-1">
                      Reserved: {format(new Date(conflict.startDate), 'HH:mm')}
                    </div>
                  ))}
                </motion.div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

// Update renderDayView function
const renderDayView = () => {
  const timeSlots = Array.from({ length: 24 }, (_, i) => i);
  const now = new Date();
  const isPastDay = currentDate < new Date(now.setHours(0, 0, 0, 0));
  const holidayInfo = holidays.find(h => h.date === currentDate.toISOString().split('T')[0]);

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm overflow-hidden">
      <div className="p-4 border-b dark:border-gray-700/50 bg-gray-50 dark:bg-gray-800/30">
        <h3 className="text-lg font-semibold">
          {format(currentDate, 'EEEE, MMMM d, yyyy')}
        </h3>
        {holidayInfo && (
          <div className="mt-1 text-sm text-violet-600 dark:text-violet-400">
            Holiday: {holidayInfo.name}
          </div>
        )}
      </div>

      {timeSlots.map((hour) => {
        const conflicts = checkTimeSlotConflicts(currentDate, hour);
        const isReserved = conflicts.length > 0;
        const isPastHour = new Date(currentDate.setHours(hour)) < now;

        return (
          <motion.div
            key={hour}
            whileHover={!isPastHour && !isReserved && !holidayInfo ? { scale: 1.01 } : {}}
            className={`
              flex items-stretch border-b dark:border-gray-700/50 last:border-b-0
              ${isReserved ? 'bg-rose-50 dark:bg-rose-900/20' : ''}
              ${!isReserved && !isPastHour && !holidayInfo ? 'hover:bg-emerald-50 dark:hover:bg-emerald-900/10 cursor-pointer' : ''}
              ${isPastHour || isPastDay ? 'bg-gray-50 dark:bg-gray-800/50' : ''}
              ${holidayInfo ? 'bg-violet-50 dark:bg-violet-900/20' : ''}
              transition-colors duration-200
            `}
            onClick={() => !isPastHour && !isReserved && !holidayInfo && handleTimeSlotClick(currentDate, hour)}
          >
            <div className="w-24 p-4 text-sm font-medium text-gray-500 border-r dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/20">
              {format(new Date().setHours(hour), 'h:mm a')}
            </div>
            <div className="flex-1 p-4">
              {isReserved ? (
                <div className="space-y-2">
                  {conflicts.map((conflict, idx) => (
                    <div key={idx} className="flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full bg-rose-400" />
                      <span className="text-sm text-rose-600 dark:text-rose-400">
                        Reserved: {format(new Date(conflict.startDate), 'h:mm a')} - {format(new Date(conflict.endDate), 'h:mm a')}
                      </span>
                    </div>
                  ))}
                </div>
              ) : !isPastHour && !holidayInfo ? (
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-sm text-emerald-600 dark:text-emerald-400">Available</span>
                </div>
              ) : null}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

const isDateInReservationRange = (date) => {
  return reservations.some(res => {
    if (!res.isReserved) return false;
    const resStart = new Date(res.reservation_form_start_date);
    const resEnd = new Date(res.reservation_form_end_date);
    const targetDate = new Date(date);
    
    // Set all dates to midnight for proper day comparison
    targetDate.setHours(0, 0, 0, 0);
    const startDay = new Date(resStart).setHours(0, 0, 0, 0);
    const endDay = new Date(resEnd).setHours(0, 0, 0, 0);
    
    return targetDate >= startDay && targetDate <= endDay;
  });
};

// Add this new time conflict check utility function

// Add helper function to determine conflict type
const getConflictType = (newStart, newEnd, existingStart, existingEnd) => {
  if (newStart < existingStart && newEnd > existingEnd) {
    return 'COMPLETE_OVERLAP';
  } else if (newStart >= existingStart && newEnd <= existingEnd) {
    return 'WITHIN_EXISTING';
  } else if (newStart < existingStart && newEnd > existingStart) {
    return 'OVERLAP_START';
  } else if (newStart < existingEnd && newEnd > existingEnd) {
    return 'OVERLAP_END';
  } else {
    return 'ADJACENT';
  }
};

// Update the handleTimeSelection function
const handleTimeSelection = () => {
  if (!isSelectionValid()) {
    toast.error('Please select both dates and times');
    return;
  }

  try {
    const startDateTime = new Date(selectedStartDate);
    const endDateTime = new Date(selectedEndDate || selectedStartDate);

    startDateTime.setHours(selectedTimes.startTime || 0);
    startDateTime.setMinutes(selectedTimes.startMinute || 0);
    endDateTime.setHours(selectedTimes.endTime || 0);
    endDateTime.setMinutes(selectedTimes.endMinute || 0);

    // For debugging
    console.log('Attempting booking:', {
      start: format(startDateTime, 'yyyy-MM-dd HH:mm'),
      end: format(endDateTime, 'yyyy-MM-dd HH:mm')
    });

    // Validate business hours
    if (startDateTime.getHours() < 5 || endDateTime.getHours() > 19) {
      toast.error('Reservations must be between 5 AM and 7 PM');
      return;
    }

    // Check for conflicts
    const conflicts = checkConflicts(startDateTime, endDateTime);
    
    if (conflicts.length > 0) {
      console.log('Conflicts found:', conflicts.map(c => ({
        start: format(new Date(c.startDate), 'yyyy-MM-dd HH:mm'),
        end: format(new Date(c.endDate), 'yyyy-MM-dd HH:mm')
      })));

      setConflictDetails({
        conflicts,
        attemptedBooking: {
          start: format(startDateTime, 'MMM dd, yyyy HH:mm'),
          end: format(endDateTime, 'MMM dd, yyyy HH:mm')
        }
      });
      setShowConflictModal(true);
      return;
    }

    // If no conflicts, proceed with the reservation
    onDateSelect(startDateTime, endDateTime);
    setIsDatePickerModalOpen(false);
  } catch (error) {
    console.error('Error in handleTimeSelection:', error);
    toast.error('An error occurred while processing your selection');
  }
};
  

const renderConflictModal = () => (
  <Dialog
    open={showConflictModal}
    onClose={() => setShowConflictModal(false)}
    className="relative z-50"
  >
    <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

    <div className="fixed inset-0 flex items-center justify-center p-4">
      <Dialog.Panel className="bg-white rounded-lg p-6 max-w-md w-full">
        <div className="mb-4">
          <div className="flex items-center mb-2">
            <span className="text-red-500 text-xl mr-2">⚠️</span>
            <Dialog.Title className="text-lg font-medium text-red-700">
              Scheduling Conflict Detected
            </Dialog.Title>
          </div>
          
          <p className="text-gray-600 mb-4">
            Your selected time slot conflicts with existing reservations:
          </p>

          {conflictDetails && (
            <>
              <div className="bg-red-50 p-4 rounded-lg mb-4">
                <p className="font-medium text-red-800 mb-2">Your attempted booking:</p>
                <p className="text-red-600">
                  From: {dayjs(conflictDetails.attemptedBooking.start).format('MMMM D, YYYY h:mm A')}
                  <br/>
                  To: {dayjs(conflictDetails.attemptedBooking.end).format('MMMM D, YYYY h:mm A')}
                </p>
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg">
                <p className="font-medium text-yellow-800 mb-2">Existing reservations:</p>
                <ul className="space-y-2">
                  {conflictDetails.conflicts.map((conflict, index) => {
                    const startDate = dayjs(conflict.startDate);
                    const endDate = dayjs(conflict.endDate);
                    const isSameDay = startDate.isSame(endDate, 'day');
                    
                    return (
                      <li key={index} className="text-yellow-700">
                        {conflict.venueName && <span className="font-medium">{conflict.venueName}</span>}
                        <br />
                        {isSameDay ? (
                          `${startDate.format('MMMM D, YYYY')} from ${startDate.format('h:mm A')} to ${endDate.format('h:mm A')}`
                        ) : (
                          `${startDate.format('MMMM D')} - ${endDate.format('MMMM D, YYYY')} from ${startDate.format('h:mm A')} to ${endDate.format('h:mm A')}`
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            </>
          )}
        </div>

        <div className="mt-6 flex justify-end space-x-3">
          <button
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            onClick={() => {
              setShowConflictModal(false);
              setSelectedTimes({
                startTime: null,
                endTime: null,
                startMinute: null,
                endMinute: null
              });
              setDateRange(null);
            }}
          >
            Choose Different Time
          </button>
        </div>
      </Dialog.Panel>
    </div>
  </Dialog>
);
  // Update the RangePicker in renderEnhancedDateTimeSelection
  

  // Update renderAvailabilityLegend to include yellow option
  const renderAvailabilityLegend = () => (
    <div className="flex flex-wrap gap-1 sm:gap-2 items-center mb-2 p-1 sm:p-2 bg-white rounded-lg text-[10px] sm:text-sm">
      <div className="flex items-center gap-1">
        <div className="w-2 h-2 sm:w-3 sm:h-3 rounded bg-green-100"></div>
        <span>Available</span>
      </div>
      <div className="flex items-center gap-1">
        <div className="w-2 h-2 sm:w-3 sm:h-3 rounded bg-yellow-100"></div>
        <span>Partially Reserved</span>
      </div>
      <div className="flex items-center gap-1">
        <div className="w-2 h-2 sm:w-3 sm:h-3 rounded bg-red-100"></div>
        <span>Fully Reserved (5AM-7PM)</span>
      </div>
      <div className="flex items-center gap-1">
        <div className="w-2 h-2 sm:w-3 sm:h-3 rounded bg-gray-100"></div>
        <span>Past</span>
      </div>
      <div className="flex items-center gap-1">
        <div className="w-2 h-2 sm:w-3 sm:h-3 rounded bg-violet-100"></div>
        <span>Holiday</span>
      </div>
    </div>
  );

  // Add this new function to handle day clicks
  const handleDayClick = (day) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const compareDate = new Date(day);
    compareDate.setHours(0, 0, 0, 0);
    
    // Only prevent dates before today (midnight)
    if (compareDate < today) {
      toast.error('Cannot select past dates');
      return;
    }
  
    const status = getAvailabilityStatus(day, reservations);
    const holidayInfo = holidays.find(h => h.date === day.toISOString().split('T')[0]);
  
    if (status === 'full') {
      toast.error('This date is already fully reserved');
      return;
    }
    
    if (holidayInfo) {
      toast.error(`Reservations not allowed on ${holidayInfo.name}`);
      return;
    }
  
    // Set only start date and open modal directly
    setSelectedStartDate(day);
    setStartDate(day);
    setEndDate(null);
    setSelectedEndDate(null);
    setIsDatePickerModalOpen(true);
    setSelectionMode('full');
  };

  // Add new handler for weekly/daily time slot clicks
  const handleTimeSlotClick = (day, hour) => {
    const now = new Date();
    const selectedDateTime = new Date(day);
    selectedDateTime.setHours(hour, 0, 0, 0);

    if (selectedDateTime < now) {
      toast.error('Cannot select past dates');
      return;
    }

    const status = getTimeSlotAvailability(day, hour, reservations);
    if (status === 'full' || status === 'reserved') {
      toast.error('This time slot is already reserved');
      return;
    }

    // Set start date and time, then open modal
    setSelectedStartDate(selectedDateTime);
    setStartDate(selectedDateTime);
    setSelectedTimes(prev => ({
      ...prev,
      startTime: hour,
      startMinute: 0
    }));
    setEndDate(null);
    setSelectedEndDate(null);
    setIsDatePickerModalOpen(true);
    setSelectionMode('end-only');
  };

  // Add this new function to render the date range modal
  const renderDateRangeModal = () => (
    <Dialog
      open={isDatePickerModalOpen}
      onClose={() => setIsDatePickerModalOpen(false)}
      className="relative z-50"
    >
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="bg-white rounded-lg p-6 max-w-md w-full">
          <Dialog.Title className="text-lg font-medium mb-4">
            Select Date and Time Range
          </Dialog.Title>

          <div className="space-y-4">
            <div className="mb-4">
              <p className="text-sm text-gray-600">Start Date:</p>
              <p className="font-medium">{dayjs(startDate).format('MMMM D, YYYY')}</p>
            </div>
            
            <div>
              <label className="block text-sm mb-2">Start Time</label>
              <TimePicker
                className="w-full"
                format="HH:mm"
                minuteStep={30}
                placeholder="Select start time"
                disabledTime={() => ({
                  disabledHours: () => [...Array(24)].map((_, i) => i).filter(h => h < 5 || h >= 19),
                })}
                onChange={(time) => {
                  if (time) {
                    setSelectedTimes(prev => ({
                      ...prev,
                      startTime: time.hour(),
                      startMinute: time.minute()
                    }));
                  }
                }}
              />
            </div>

            <div>
              <label className="block text-sm mb-2">End Time</label>
              <TimePicker
                className="w-full"
                format="HH:mm"
                minuteStep={30}
                placeholder="Select end time"
                disabledTime={() => ({
                  disabledHours: () => [...Array(24)].map((_, i) => i).filter(h => h < 5 || h >= 19),
                })}
                onChange={(time) => {
                  if (time) {
                    setSelectedTimes(prev => ({
                      ...prev,
                      endTime: time.hour(),
                      endMinute: time.minute()
                    }));
                  }
                }}
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
              onClick={() => setIsDatePickerModalOpen(false)}
            >
              Cancel
            </button>
            <button
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              onClick={() => {
                if (!selectedTimes.startTime || !selectedTimes.endTime) {
                  toast.error('Please select both start and end times');
                  return;
                }

                const startDateTime = dayjs(startDate)
                  .hour(selectedTimes.startTime)
                  .minute(selectedTimes.startMinute || 0)
                  .toDate();

                const endDateTime = dayjs(startDate)
                  .hour(selectedTimes.endTime)
                  .minute(selectedTimes.endMinute || 0)
                  .toDate();

                if (endDateTime <= startDateTime) {
                  toast.error('End time must be after start time');
                  return;
                }

                const conflicts = checkTimeSlotConflicts(startDateTime, endDateTime, reservations);
                
                if (conflicts.length > 0) {
                  setConflictDetails({
                    conflicts,
                    attemptedBooking: {
                      start: dayjs(startDateTime).format('MMM DD, YYYY HH:mm'),
                      end: dayjs(endDateTime).format('MMM DD, YYYY HH:mm')
                    }
                  });
                  setShowConflictModal(true);
                  return;
                }

                onDateSelect(startDateTime, endDateTime);
                setIsDatePickerModalOpen(false);
              }}
            >
              Confirm
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );

  // Add this new date-time selection modal component
  const renderDateTimeSelectionModal = () => (
    <Dialog
      open={isDatePickerModalOpen}
      onClose={() => setIsDatePickerModalOpen(false)}
      className="relative z-50"
    >
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-4 sm:p-6 w-full max-w-[340px] sm:max-w-md">
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="text-base sm:text-lg font-semibold">
              Select Reservation Period
            </Dialog.Title>
            <button
              onClick={() => setIsDatePickerModalOpen(false)}
              className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <span className="sr-only">Close</span>
              ✕
            </button>
          </div>

          <div className="space-y-4">
            {/* Start Date Display (not editable) */}
            <div>
              <label className="block text-xs sm:text-sm font-medium mb-1">Start Date</label>
              <div className="w-full p-2 bg-gray-50 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600">
                {dayjs(selectedStartDate).format('MMMM D, YYYY')}
              </div>
            </div>

            {/* End Date Selection */}
            <div>
              <label className="block text-xs sm:text-sm font-medium mb-1">End Date</label>
              <DatePicker
                className="w-full"
                value={selectedEndDate ? dayjs(selectedEndDate) : null}
                onChange={(date) => setSelectedEndDate(date.toDate())}
                disabledDate={(current) => {
                  return current < dayjs(selectedStartDate).startOf('day') ||
                         current < dayjs().startOf('day');
                }}
              />
            </div>

            {/* Time Selection */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium mb-1">Start Time</label>
                <TimePicker
                  className="w-full text-xs sm:text-sm"
                  format="HH:mm"
                  minuteStep={30}
                  popupClassName="text-xs sm:text-sm"
                  value={selectedTimes.startTime ? 
                    dayjs().hour(selectedTimes.startTime).minute(selectedTimes.startMinute || 0) : 
                    null
                  }
                  disabledTime={() => ({
                    disabledHours: () => [...Array(24)].map((_, i) => i).filter(h => h < 5 || h >= 20),
                    disabledMinutes: () => []
                  })}
                  onChange={(time) => {
                    if (time) {
                      setSelectedTimes(prev => ({
                        ...prev,
                        startTime: time.hour(),
                        startMinute: time.minute()
                      }));
                    }
                  }}
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium mb-1">End Time</label>
                <TimePicker
                  className="w-full text-xs sm:text-sm"
                  format="HH:mm"
                  minuteStep={30}
                  popupClassName="text-xs sm:text-sm"
                  value={selectedTimes.endTime ? 
                    dayjs().hour(selectedTimes.endTime).minute(selectedTimes.endMinute || 0) : 
                    null
                  }
                  disabledTime={() => ({
                    disabledHours: () => [...Array(24)].map((_, i) => i).filter(h => h < 5 || h >= 20),
                    disabledMinutes: (selectedHour) => {
                      if (isSameDay(selectedStartDate, selectedEndDate) &&
                          selectedHour === selectedTimes.startTime) {
                        return [...Array(60)].map((_, i) => i)
                          .filter(m => m <= selectedTimes.startMinute);
                      }
                      return [];
                    }
                  })}
                  onChange={(time) => {
                    if (time) {
                      setSelectedTimes(prev => ({
                        ...prev,
                        endTime: time.hour(),
                        endMinute: time.minute()
                      }));
                    }
                  }}
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-4 sm:mt-6 flex gap-2 sm:gap-3">
            <button
              className="flex-1 px-3 py-2 text-xs sm:text-sm font-medium text-gray-600 bg-gray-100 
                       hover:bg-gray-200 rounded-lg transition-colors"
              onClick={() => setIsDatePickerModalOpen(false)}
            >
              Cancel
            </button>
            <button
              className="flex-1 px-3 py-2 text-xs sm:text-sm font-medium text-white bg-blue-500 
                       hover:bg-blue-600 rounded-lg transition-colors disabled:opacity-50"
              onClick={() => {
                // Validate date selection
                if (!selectedStartDate || !selectedEndDate) {
                  toast.error('Please select both start and end dates');
                  return;
                }

                // Validate time selection
                if (!selectedTimes.startTime || !selectedTimes.endTime) {
                  toast.error('Please select both start and end times');
                  return;
                }

                const startDateTime = dayjs(selectedStartDate)
                  .hour(selectedTimes.startTime)
                  .minute(selectedTimes.startMinute || 0)
                  .toDate();

                const endDateTime = dayjs(selectedEndDate)
                  .hour(selectedTimes.endTime)
                  .minute(selectedTimes.endMinute || 0)
                  .toDate();

                // Validate date-time combination
                if (endDateTime <= startDateTime) {
                  toast.error('End date-time must be after start date-time');
                  return;
                }

                // Check for conflicts
                const conflicts = checkConflicts(startDateTime, endDateTime);
                if (conflicts.length > 0) {
                  setConflictDetails({
                    conflicts,
                    attemptedBooking: {
                      start: dayjs(startDateTime).format('MMM DD, YYYY HH:mm'),
                      end: dayjs(endDateTime).format('MMM DD, YYYY HH:mm')
                    }
                  });
                  setShowConflictModal(true);
                  return;
                }

                // If all validations pass, proceed with the selection
                onDateSelect(startDateTime, endDateTime);
                setIsDatePickerModalOpen(false);
              }}
              disabled={!selectedStartDate || !selectedEndDate || !selectedTimes.startTime || !selectedTimes.endTime}
            >
              Confirm
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );

  // Add this new function before the return statement
const renderTimeSelectionModal = () => (
  <Dialog
    open={timeModalOpen}
    onClose={() => setTimeModalOpen(false)}
    className="relative z-50"
  >
    <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
    <div className="fixed inset-0 flex items-center justify-center p-4">
      <Dialog.Panel className="bg-white rounded-lg p-6 max-w-md w-full">
        <Dialog.Title className="text-lg font-medium mb-4">
          Select Time Range
        </Dialog.Title>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Start Time</label>
              <TimePicker
                className="w-full"
                format="HH:mm"
                minuteStep={30}
                value={selectedTimes.startTime ? 
                  dayjs().hour(selectedTimes.startTime).minute(selectedTimes.startMinute || 0) : 
                  null
                }
                onChange={(time) => {
                  if (time) {
                    setSelectedTimes(prev => ({
                      ...prev,
                      startTime: time.hour(),
                      startMinute: time.minute()
                    }));
                  }
                }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">End Time</label>
              <TimePicker
                className="w-full"
                format="HH:mm"
                minuteStep={30}
                value={selectedTimes.endTime ? 
                  dayjs().hour(selectedTimes.endTime).minute(selectedTimes.endMinute || 0) : 
                  null
                }
                onChange={(time) => {
                  if (time) {
                    setSelectedTimes(prev => ({
                      ...prev,
                      endTime: time.hour(),
                      endMinute: time.minute()
                    }));
                  }
                }}
              />
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end space-x-3">
          <button
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
            onClick={() => setTimeModalOpen(false)}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            onClick={handleTimeSelection}
          >
            Confirm
          </button>
        </div>
      </Dialog.Panel>
    </div>
  </Dialog>
);

// Update the checkTimeSlotConflicts function
const checkTimeSlotConflicts = (date, hour) => {
  return reservations.filter(res => {
    if (!res.isReserved) return false;

    const resStart = new Date(res.startDate);
    const resEnd = new Date(res.endDate);
    const slotDate = new Date(date);
    slotDate.setHours(hour, 0, 0, 0);

    // Check if the day and hour falls within any reservation period
    if (slotDate >= resStart && slotDate <= resEnd) {
      const slotHour = hour;
      const resStartHour = resStart.getHours();
      const resEndHour = resEnd.getHours();
      
      // Check if current hour falls within reservation hours
      return slotHour >= resStartHour && slotHour < resEndHour;
    }
    return false;
  });
};

// Update renderWeekView function


// Update renderDayView function


const checkConflicts = (attemptedStart, attemptedEnd) => {
  if (!attemptedStart || !attemptedEnd) return [];

  return reservations.filter(res => {
    if (!res.isReserved) return false;

    const resStart = new Date(res.startDate);
    const resEnd = new Date(res.endDate);

    // For debugging
    console.log('Checking conflict:', {
      attempted: {
        start: format(attemptedStart, 'yyyy-MM-dd HH:mm'),
        end: format(attemptedEnd, 'yyyy-MM-dd HH:mm')
      },
      existing: {
        start: format(resStart, 'yyyy-MM-dd HH:mm'),
        end: format(resEnd, 'yyyy-MM-dd HH:mm')
      }
    });

    // Compare dates and times separately for more precise overlap checking
    const sameStartDay = isSameDay(attemptedStart, resStart);
    const sameEndDay = isSameDay(attemptedEnd, resEnd);
    
    // If it's the same day, check time overlaps
    if (sameStartDay || sameEndDay) {
      const attemptedStartTime = attemptedStart.getHours() * 60 + attemptedStart.getMinutes();
      const attemptedEndTime = attemptedEnd.getHours() * 60 + attemptedEnd.getMinutes();
      const resStartTime = resStart.getHours() * 60 + resStart.getMinutes();
      const resEndTime = resEnd.getHours() * 60 + resEnd.getMinutes();

      // Check if times overlap on the same day
      if (sameStartDay && sameEndDay) {
        return !(attemptedEndTime <= resStartTime || attemptedStartTime >= resEndTime);
      }
    }

    // For different days, check if reservation periods overlap at all
    const midnightAttemptedStart = new Date(attemptedStart);
    midnightAttemptedStart.setHours(0, 0, 0, 0);
    const midnightAttemptedEnd = new Date(attemptedEnd);
    midnightAttemptedEnd.setHours(23, 59, 59, 999);

    const midnightResStart = new Date(resStart);
    midnightResStart.setHours(0, 0, 0, 0);
    const midnightResEnd = new Date(resEnd);
    midnightResEnd.setHours(23, 59, 59, 999);

    // No overlap if either period is entirely before or after the other
    return !(midnightAttemptedEnd < midnightResStart || midnightAttemptedStart > midnightResEnd);
  });
};

  // Enhanced calendar view with loading state
  return (
    <div className="p-1.5 sm:p-4 space-y-2 sm:space-y-4 bg-white dark:bg-gray-900 rounded-lg shadow-sm">
      <div className="relative">
        <AnimatePresence>
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-white/90 dark:bg-gray-900/90 z-10 flex items-center justify-center"
            >
              <Spin size="small" />
            </motion.div>
          )}
        </AnimatePresence>

        {renderAvailabilityLegend()}

  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 mb-3 sm:mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 sm:gap-2">
              <button
                onClick={() => handleDateNavigation('prev')}
                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                ←
              </button>
              <h2 className="text-sm sm:text-lg font-semibold">
                {format(currentDate, 'MMM yyyy')}
              </h2>
              <button
                onClick={() => handleDateNavigation('next')}
                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                →
              </button>
            </div>
          </div>
          
          {/* View toggles */}
          <div className="flex gap-0.5 sm:gap-2">
            {['month', 'week', 'day'].map((viewType) => (
              <button
                key={viewType}
                onClick={() => setView(viewType)}
                className={`px-2 py-1 text-[10px] sm:text-xs font-medium rounded-md
                  ${view === viewType 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
              >
                {viewType.charAt(0).toUpperCase() + viewType.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {view === 'month' && (
          <>
            <div className="mb-2 grid grid-cols-7 gap-0.5 sm:gap-1">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => (
                <div key={day} className="text-center font-medium text-gray-500 text-[10px] sm:text-sm">
                  {day}
                </div>
              ))}
            </div>
            {renderCalendarGrid()}
          </>
        )}
        {view === 'week' && renderWeekView()}
        {view === 'day' && renderDayView()}

        {renderTimeSelectionModal()}
        {renderDateRangeModal()}
        {renderConflictModal()}
        {renderDateTimeSelectionModal()}
      </div>
    </div>
  );
};

export default ReservationCalendar;


