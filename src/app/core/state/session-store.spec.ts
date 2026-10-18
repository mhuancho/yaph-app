import { TestBed } from '@angular/core/testing';
import { CURRENT_PROFILE } from '../data/mock-profiles';
import { SessionStore } from './session-store';

describe('SessionStore', () => {
  function store(): SessionStore {
    return TestBed.inject(SessionStore);
  }

  it('arranca sin sesión y con el perfil de demostración', () => {
    const session = store();

    expect(session.signedIn()).toBe(false);
    expect(session.profile().handle).toBe(CURRENT_PROFILE.handle);
  });

  it('escribe la identidad sobre el perfil y le pone la arroba', () => {
    const session = store();

    expect(session.signIn('Kuri.Dev', '  Kuri  ')).toBe(true);
    expect(session.signedIn()).toBe(true);
    expect(session.profile().handle).toBe('@Kuri.Dev');
    expect(session.profile().displayName).toBe('Kuri');
    // La identidad no inventa contenido: los contadores siguen siendo los del
    // perfil de demostración hasta que haya backend.
    expect(session.profile().followers).toBe(CURRENT_PROFILE.followers);
  });

  it('acepta el handle escrito con arroba sin duplicarla', () => {
    const session = store();
    session.signIn('@kuri.dev', 'Kuri');

    expect(session.profile().handle).toBe('@kuri.dev');
  });

  it('cae al handle como nombre si el nombre viene vacío', () => {
    const session = store();
    session.signIn('kuri.dev', '   ');

    expect(session.profile().displayName).toBe('@kuri.dev');
  });

  it('rechaza un handle con formato inválido', () => {
    const session = store();

    expect(session.signIn('ab', 'Corto')).toBe(false);
    expect(session.signIn('con espacio', 'Espacio')).toBe(false);
    expect(session.signIn('.empieza.en.punto', 'Punto')).toBe(false);
    expect(session.signedIn()).toBe(false);
  });

  /**
   * Suplantar a un creador del catálogo dejaría además dos perfiles con el
   * mismo handle, y `ProfileStore.byHandle` solo puede devolver uno.
   */
  it('reserva los handles del catálogo', () => {
    const session = store();

    expect(session.isReserved('nyx.render')).toBe(true);
    expect(session.isReserved('@NYX.RENDER')).toBe(true);
    expect(session.signIn('nyx.render', 'Falso Nyx')).toBe(false);
    expect(session.signedIn()).toBe(false);
  });

  it('da al avatar un color propio del handle y estable', () => {
    const session = store();

    session.signIn('kuri.dev', 'Kuri');
    const first = session.profile().avatar;

    // El color es del handle, no del nombre: cambiar el nombre no lo mueve.
    session.signIn('kuri.dev', 'Kuri con otro nombre');
    expect(session.profile().avatar).toEqual(first);

    // Y no es el degradado fijo del perfil de demostración para todos.
    session.signIn('hex.mode', 'Hex');
    expect(session.profile().avatar).not.toEqual(first);
  });

  it('sobrevive a la recarga y se va al cerrar sesión', () => {
    store().signIn('kuri.dev', 'Kuri');

    // Una instancia nueva es lo que ocurre al recargar la página.
    TestBed.resetTestingModule();
    expect(store().profile().handle).toBe('@kuri.dev');

    store().signOut();
    expect(store().signedIn()).toBe(false);

    TestBed.resetTestingModule();
    expect(store().signedIn()).toBe(false);
  });
});
